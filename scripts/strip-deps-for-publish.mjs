#!/usr/bin/env node
/**
 * prepack / postpack: strip `dependencies` from the published manifest.
 *
 * The repo root package.json is BOTH the Next.js app manifest (needs all its
 * runtime deps to dev/build) AND the published @nqlib/nqchart library manifest.
 * The built library externalizes only its peer deps (react, react-dom, echarts,
 * motion) — every other dep is either bundled into dist/ or app-only. Shipping
 * the app's full `dependencies` would force consumers to install Next.js,
 * fumadocs, radix, etc.
 *
 * npm runs `prepack` right before creating the tarball and `postpack` right
 * after, for both `npm publish` and `npm pack`. So:
 *   - prepack  → back up package.json, rewrite it with dependencies removed
 *                (peerDependencies kept), so the tarball's manifest is clean.
 *   - postpack → restore the original package.json, so the working tree (and
 *                the app's dev/build) is unaffected.
 *
 * Usage: node scripts/strip-deps-for-publish.mjs prepack|postpack
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = join(root, "package.json");
const backupPath = join(root, "package.json.publish-backup");

const mode = process.argv[2];

if (mode === "prepack") {
  // Guard against a stale backup from a previously interrupted pack.
  if (existsSync(backupPath)) {
    console.error(
      "strip-deps — package.json.publish-backup already exists; a prior pack did not finish. " +
        "Restore package.json from it and remove the backup before packing again.",
    );
    process.exit(1);
  }
  copyFileSync(pkgPath, backupPath);
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const depCount = Object.keys(pkg.dependencies ?? {}).length;
  delete pkg.dependencies;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.error(
    `strip-deps — removed ${depCount} dependencies for pack (peerDependencies kept)`,
  );
} else if (mode === "postpack") {
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, pkgPath);
    rmSync(backupPath);
    console.error("strip-deps — restored original package.json");
  } else {
    console.warn("strip-deps — no backup found; package.json left as-is");
  }
} else {
  console.error("strip-deps — expected argument: prepack | postpack");
  process.exit(1);
}
