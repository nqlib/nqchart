#!/usr/bin/env node
/**
 * Capture README marketing screenshots from a running BeeCharts site.
 *
 * Usage:
 *   pnpm build && pnpm start &   # terminal 1
 *   pnpm capture:readme          # terminal 2
 *
 * Or point at any deployed URL:
 *   BASE_URL=https://beecharts.vercel.app pnpm capture:readme
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Page } from "playwright";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "docs/assets/readme");
const chartsDir = path.join(outDir, "charts");

function resolveBaseUrl() {
  return (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
}

const SERVER_PORT = process.env.CAPTURE_PORT ?? "3001";
const VIEWPORT = { width: 1280, height: 800 };

type ChartCapture = {
  file: string;
  path: string;
  /** Scroll target before screenshot (preview block title substring). */
  previewTitle?: string;
};

const CHART_CAPTURES: ChartCapture[] = [
  { file: "bar-stacked.png", path: "/docs/bar-chart/static", previewTitle: "stackType='stacked'" },
  { file: "area-brush.png", path: "/docs/area-chart/static", previewTitle: "Basic Chart" },
  { file: "radial-gauge.png", path: "/docs/radial-chart/static", previewTitle: "Basic Chart" },
  { file: "funnel.png", path: "/docs/funnel-chart/static", previewTitle: "Basic Chart" },
  { file: "waterfall.png", path: "/docs/waterfall-chart/static", previewTitle: "Basic Chart" },
];

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url: string, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(500);
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

function startProductionServer(): ChildProcess {
  const child = spawn("pnpm", ["start"], {
    cwd: root,
    env: { ...process.env, PORT: SERVER_PORT, HOSTNAME: "127.0.0.1" },
    stdio: "pipe",
  });
  child.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
    root.style.colorScheme = mode;
  }, theme);
}

async function scrollForLazyMount(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.85));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await sleep(300);
}

const CAPTURE_QUERY = "?capture=1";

async function scrollUntilVisible(page: Page, text: string, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const count = await page.getByText(text, { exact: false }).count();
    if (count > 0) return;

    await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.6)));
    await sleep(400);
  }
  throw new Error(`Timed out waiting for "${text}"`);
}

async function waitForDashboard(page: Page) {
  await scrollUntilVisible(page, "Revenue overview");
  await page.getByRole("heading", { name: "Revenue overview" }).waitFor({ timeout: 15_000 });
  await waitForChartCanvas(page);
}

async function waitForChartCanvas(page: Page) {
  await page.waitForSelector("canvas", { timeout: 60_000 });
  await sleep(1500);
}

async function captureDashboardHero(page: Page, theme: "light" | "dark", filename: string) {
  await setTheme(page, theme);
  await page.setViewportSize(VIEWPORT);
  await page.goto(`${resolveBaseUrl()}${CAPTURE_QUERY}`, { waitUntil: "load" });
  await waitForDashboard(page);

  const heading = page.getByRole("heading", { name: "Revenue overview" });
  await heading.scrollIntoViewIfNeeded();
  const section = page.locator("section").filter({ has: heading }).first();
  await section.screenshot({
    path: path.join(outDir, filename),
    animations: "disabled",
  });
  console.log(`  ✓ ${filename}`);
}

async function captureGallery(page: Page, theme: "light" | "dark", filename: string) {
  await setTheme(page, theme);
  await page.goto(`${resolveBaseUrl()}${CAPTURE_QUERY}`, { waitUntil: "load" });
  await scrollForLazyMount(page);

  const heading = page.getByRole("heading", { name: "Every chart, one composable API" });
  await heading.waitFor({ timeout: 30_000 });
  await heading.scrollIntoViewIfNeeded();
  await sleep(500);

  const section = page.locator("section").filter({ has: heading }).first();
  await section.screenshot({
    path: path.join(outDir, filename),
    animations: "disabled",
  });
  console.log(`  ✓ ${filename}`);
}

async function captureDocPreview(page: Page, capture: ChartCapture) {
  await setTheme(page, "light");
  await page.goto(`${resolveBaseUrl()}${capture.path}`, { waitUntil: "domcontentloaded" });

  const previewRoot = capture.previewTitle
    ? page
        .locator(".group.relative")
        .filter({ has: page.getByText(capture.previewTitle, { exact: false }) })
        .first()
    : page.locator("[data-slot='preview']").first();

  if (capture.previewTitle) {
    await scrollUntilVisible(page, capture.previewTitle);
  }
  await previewRoot.scrollIntoViewIfNeeded();
  await previewRoot.waitFor({ state: "visible", timeout: 30_000 });
  await waitForChartCanvas(page);

  await previewRoot.screenshot({
    path: path.join(chartsDir, capture.file),
    animations: "disabled",
  });
  console.log(`  ✓ charts/${capture.file}`);
}

async function captureSocialPreview(page: Page) {
  await setTheme(page, "dark");
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.goto(`${resolveBaseUrl()}${CAPTURE_QUERY}`, { waitUntil: "load" });
  await waitForDashboard(page);

  await page.screenshot({
    path: path.join(outDir, "social-preview.png"),
    clip: { x: 0, y: 0, width: 1280, height: 640 },
    animations: "disabled",
  });
  console.log("  ✓ social-preview.png (upload to GitHub → Settings → Social preview)");
}

async function runCaptures() {
  await mkdir(outDir, { recursive: true });
  await mkdir(chartsDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`Capturing from ${resolveBaseUrl()} → docs/assets/readme/`);

  console.log("Dashboard heroes…");
  await captureDashboardHero(page, "light", "hero-dashboard-light.png");
  await captureDashboardHero(page, "dark", "hero-dashboard-dark.png");

  console.log("Gallery…");
  await captureGallery(page, "light", "gallery-light.png");

  console.log("Chart previews…");
  for (const capture of CHART_CAPTURES) {
    await captureDocPreview(page, capture);
  }

  console.log("Social preview…");
  await captureSocialPreview(page);

  await browser.close();
  console.log("Done.");
}

async function main() {
  const manageServer = !process.env.BASE_URL;
  let server: ChildProcess | undefined;

  if (manageServer) {
    const baseUrl = `http://127.0.0.1:${SERVER_PORT}`;
    console.log(`Starting production server on :${SERVER_PORT}…`);
    server = startProductionServer();
    await waitForServer(baseUrl);
    process.env.BASE_URL = baseUrl;
  }

  try {
    await runCaptures();
  } finally {
    server?.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
