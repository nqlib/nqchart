#!/usr/bin/env node
/**
 * Pre-publish gate for @nqlib/nqchart.
 *
 * Runs from the repo root (this package publishes from root, not a sub-package).
 * Builds the library, runs unit tests, then asserts the publish tarball
 * actually contains the entry points + types consumers import — npm silently
 * drops anything not matched by "files", so a misconfigured manifest ships a
 * broken package without erroring.
 */
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(`\nverify:publish — step failed: ${command} ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }
}

function verifyTarball() {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(result.stderr || "npm pack --dry-run failed");
    process.exit(result.status ?? 1);
  }
  const meta = JSON.parse(result.stdout)[0];
  const files = meta.files.map((f) => f.path);
  const required = [
    "README.md",
    "dist/index.mjs",
    "dist/index.cjs",
    "dist/types/lib/public.d.ts",
    "dist/bar-chart.mjs",
    "dist/bar-chart.cjs",
    "dist/types/registry/charts/bar-chart.d.ts",
  ];
  const missing = required.filter((r) => !files.includes(r));
  const leaked = files.filter(
    (f) => f.includes("..") || f.startsWith("src/app") || f.startsWith(".next"),
  );
  // Guard against re-polluting the tarball with app assets (public/ og images,
  // registry json) if the publicDir:false safeguard ever regresses.
  const assets = files.filter(
    (f) => f.endsWith(".png") || f.startsWith("dist/og") || f.startsWith("dist/web"),
  );
  if (missing.length) {
    console.error(`verify:publish — tarball missing required files: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (leaked.length) {
    console.error(`verify:publish — tarball leaks non-library paths: ${leaked.join(", ")}`);
    process.exit(1);
  }
  if (assets.length) {
    console.error(`verify:publish — tarball contains app assets (should be library-only): ${assets.slice(0, 5).join(", ")}`);
    process.exit(1);
  }
  console.log(
    `verify:publish — tarball OK (${meta.entryCount} files, ${(meta.size / 1024).toFixed(0)}KB, entries + types present)`,
  );
}

// The root package.json doubles as the Next.js app manifest (65 runtime deps).
// prepack strips `dependencies` from the PUBLISHED manifest so consumers don't
// pull the whole app. Verify that by packing a real tarball and reading the
// package.json inside it — a dry-run can't show the packed manifest contents.
function verifyPublishedManifest() {
  const packResult = spawnSync("npm", ["pack", "--json"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (packResult.status !== 0) {
    console.error(packResult.stderr || "npm pack failed");
    process.exit(packResult.status ?? 1);
  }
  const tarball = JSON.parse(packResult.stdout)[0].filename;
  try {
    const manifest = spawnSync(
      "tar",
      ["-xzOf", join(root, tarball), "package/package.json"],
      { cwd: root, encoding: "utf8", shell: process.platform === "win32" },
    );
    if (manifest.status !== 0) {
      console.error(manifest.stderr || "could not read package.json from tarball");
      process.exit(manifest.status ?? 1);
    }
    const packed = JSON.parse(manifest.stdout);
    const depCount = Object.keys(packed.dependencies ?? {}).length;
    const peerCount = Object.keys(packed.peerDependencies ?? {}).length;
    const scriptNames = Object.keys(packed.scripts ?? {});
    if (depCount > 0) {
      console.error(
        `verify:publish — published manifest still has ${depCount} dependencies; prepack strip did not run. Consumers would install the whole app.`,
      );
      process.exit(1);
    }
    if (peerCount === 0) {
      console.error("verify:publish — published manifest has no peerDependencies; expected react/react-dom/echarts/motion.");
      process.exit(1);
    }
    // Any install-time lifecycle script runs in the CONSUMER's project on
    // `npm i`. The app's `postinstall: fumadocs-mdx` breaks installs — assert
    // no such scripts survive into the published manifest.
    const installHooks = scriptNames.filter((s) =>
      ["preinstall", "install", "postinstall", "prepare", "preprepare", "postprepare"].includes(s),
    );
    if (installHooks.length) {
      console.error(
        `verify:publish — published manifest has consumer-facing lifecycle scripts: ${installHooks.join(", ")}. These run on 'npm i' and can break installs.`,
      );
      process.exit(1);
    }
    console.log(
      `verify:publish — published manifest OK (0 dependencies, ${peerCount} peerDependencies, 0 install scripts)`,
    );
  } finally {
    // Clean up the real tarball we created for inspection.
    rmSync(join(root, tarball), { force: true });
  }
}

console.log("verify:publish — running pre-publish checks\n");

// 1. Build the library (JS bundle + .d.ts with alias rewrite).
run("pnpm", ["run", "build:npm"]);

// 2. Unit tests.
run("pnpm", ["run", "test"]);

// 3. Smoke-test the BUILT artifacts import and expose expected exports.
run("node", [join(root, "scripts", "smoke-dist.mjs")]);

// 4. Verify the publish tarball contents.
verifyTarball();

// 5. Verify the published manifest strips the app's dependencies.
verifyPublishedManifest();

console.log("\nverify:publish — all checks passed");
