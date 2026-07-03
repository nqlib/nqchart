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

console.log("verify:publish — running pre-publish checks\n");

// 1. Build the library (JS bundle + .d.ts with alias rewrite).
run("pnpm", ["run", "build:npm"]);

// 2. Unit tests.
run("pnpm", ["run", "test"]);

// 3. Smoke-test the BUILT artifacts import and expose expected exports.
run("node", [join(root, "scripts", "smoke-dist.mjs")]);

// 4. Verify the publish tarball contents.
verifyTarball();

console.log("\nverify:publish — all checks passed");
