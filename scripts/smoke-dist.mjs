#!/usr/bin/env node
/**
 * Smoke-test the BUILT library artifacts in dist/.
 *
 * Imports each chart-family entry (ES + CJS) and the root entry exactly as a
 * consumer would, and asserts the key compound-component exports are present.
 * Catches a broken bundle (missing export, unresolved external) that a source
 * typecheck would not.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const require = createRequire(import.meta.url);

const CHECKS = [
  { entry: "index", expect: ["ChartConfig?", "useChart", "ChartTooltip", "ChartLegend"] },
  { entry: "recipes", expect: ["binForHistogram", "prepareParetoData", "prepareGaugeRows"] },
  { entry: "bar-chart", expect: ["NQBarChart", "Bar", "XAxis", "Tooltip"] },
  { entry: "area-chart", expect: ["NQAreaChart", "Area"] },
  { entry: "line-chart", expect: ["NQLineChart", "Line"] },
  { entry: "pie-chart", expect: ["NQPieChart", "Pie"] },
  { entry: "radar-chart", expect: ["NQRadarChart", "Radar"] },
  { entry: "radial-chart", expect: ["NQRadialChart", "RadialBar"] },
  { entry: "scatter-chart", expect: ["NQScatterChart", "Scatter"] },
  { entry: "heatmap-chart", expect: ["NQHeatmapChart", "Heatmap"] },
  { entry: "calendar-chart", expect: ["NQCalendarChart", "Calendar"] },
  { entry: "treemap-chart", expect: ["NQTreemapChart", "Tiles"] },
  { entry: "waterfall-chart", expect: ["NQWaterfallChart", "Bars"] },
  { entry: "funnel-chart", expect: ["NQFunnelChart", "Stages"] },
  { entry: "sparkline-chart", expect: ["NQSparklineChart", "Sparkline"] },
  { entry: "composed-chart", expect: ["NQComposedChart", "Bar", "Line"] },
  {
    entry: "headless",
    expect: ["compileComposedOption", "renderToSvg", "withHeadlessTheme", "printLegend"],
  },
];

// --- One real headless render (plan 018) -------------------------------------
// A three-row composed chart with one bar and one dashed line, a registered theme,
// the print legend, rendered to SVG at 640×300 in Node with no DOM.
const SMOKE_THEME = {
  isDark: false,
  chrome: {
    foreground: "#1a2b3c",
    background: "#ffffff",
    muted: "#5b6470",
    border: "#e3e6ea",
    splitLine: "#e3e6ea",
    popover: "#ffffff",
    popoverForeground: "#1a2b3c",
  },
  tones: {
    neutral: "#6b7280",
    accent: "#2563eb",
    positive: "#16a34a",
    warning: "#d97706",
    critical: "#dc2626",
  },
  tokens: { "--metric-plan": "#1d4ed8" },
  radiusPx: 8,
  fontFamily: "Inter, sans-serif",
  animation: false,
};

function headlessRender(mod) {
  const chartId = "smoke-composed";
  const config = {
    actual: { label: "Actual hours", colors: { light: ["#f97316"] } },
    plan: { label: "Planned hours", colors: { light: ["var(--metric-plan)"] } },
  };
  const legend = { type: "legend", id: "legend", align: "center" };
  const ctx = {
    chartId,
    config,
    xDataKey: "month",
    data: [
      { month: "Jan", actual: 40, plan: 50 },
      { month: "Feb", actual: 55, plan: 50 },
      { month: "Mar", actual: 62, plan: 60 },
    ],
    parts: [
      { type: "grid", id: "grid" },
      { type: "xAxis", id: "x", dataKey: "month" },
      { type: "yAxis", id: "y" },
      { type: "bar", id: "bar", dataKey: "actual" },
      { type: "line", id: "line", dataKey: "plan", variant: "dashed" },
      legend,
    ],
    resolveColor: mod.createColorResolver(chartId, config),
  };
  const option = mod.withHeadlessTheme(chartId, SMOKE_THEME, () =>
    mod.printLegend(ctx, legend, mod.compileComposedOption(ctx)),
  );
  const svg = mod.renderToSvg(option, { width: 640, height: 300 });
  const problems = [];
  if (!svg.startsWith("<svg")) problems.push("does not start with <svg");
  if (!/stroke="#1d4ed8"[^>]*stroke-dasharray/.test(svg)) problems.push("no dashed series line");
  if (!svg.toLowerCase().includes(SMOKE_THEME.chrome.foreground)) problems.push("no foreground hex");
  if (!svg.includes("Actual hours") || !svg.includes("Planned hours")) problems.push("no legend text");
  return { svg, problems };
}

let failed = 0;

function assertExports(label, mod, expected) {
  const keys = Object.keys(mod);
  // "Name?" means type-only — absent from runtime exports, skip.
  const missing = expected
    .filter((n) => !n.endsWith("?"))
    .filter((n) => !keys.includes(n));
  if (missing.length) {
    console.error(`  ✗ ${label} — missing exports: ${missing.join(", ")}`);
    failed++;
  } else {
    console.log(`  ✓ ${label}`);
  }
}

console.log("smoke-dist — importing built ES artifacts");
for (const { entry, expect } of CHECKS) {
  try {
    const mod = await import(join(dist, `${entry}.mjs`));
    assertExports(`${entry}.mjs`, mod, expect);
  } catch (err) {
    console.error(`  ✗ ${entry}.mjs — import failed: ${err.message}`);
    failed++;
  }
}

console.log("smoke-dist — importing built CJS artifacts");
for (const { entry, expect } of CHECKS) {
  try {
    const mod = require(join(dist, `${entry}.cjs`));
    assertExports(`${entry}.cjs`, mod, expect);
  } catch (err) {
    console.error(`  ✗ ${entry}.cjs — import failed: ${err.message}`);
    failed++;
  }
}

console.log("smoke-dist — headless render (composed, 640×300, SVG in Node)");
for (const [label, load] of [
  ["headless.mjs", () => import(join(dist, "headless.mjs"))],
  ["headless.cjs", async () => require(join(dist, "headless.cjs"))],
]) {
  try {
    const { svg, problems } = headlessRender(await load());
    if (problems.length) {
      console.error(`  ✗ ${label} render — ${problems.join("; ")}`);
      failed++;
    } else {
      console.log(`  ✓ ${label} render — ${svg.length} chars, dashed line, legend, theme foreground`);
    }
  } catch (err) {
    console.error(`  ✗ ${label} render — failed: ${err.message}`);
    failed++;
  }
}

if (failed) {
  console.error(`\nsmoke-dist — ${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nsmoke-dist — all built artifacts OK");
