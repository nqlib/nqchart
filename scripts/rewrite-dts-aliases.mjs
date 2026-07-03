#!/usr/bin/env node
/**
 * Rewrite "@/..." path-alias imports in emitted .d.ts files to relative paths.
 *
 * tsc emits declarations preserving the source tree under dist/types/ (rootDir
 * = src), but it leaves "@/registry/..." specifiers verbatim — consumers can't
 * resolve those. The alias "@/*" maps to "src/*", and src/ is the declaration
 * rootDir, so "@/x" corresponds to dist/types/x. This rewrites each "@/x" to a
 * path relative to the importing file's own location.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, posix } from "node:path";
import { globSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const typesRoot = join(root, "dist", "types");

const files = globSync("**/*.d.ts", { cwd: typesRoot }).map((f) =>
  join(typesRoot, f),
);

const ALIAS_RE = /(["'])@\/([^"']+)\1/g;
let changed = 0;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const fileDir = dirname(file);
  const next = src.replace(ALIAS_RE, (_m, q, spec) => {
    // Target under dist/types is typesRoot/<spec>. Make it relative to fileDir.
    const target = join(typesRoot, spec);
    let rel = relative(fileDir, target).split("\\").join("/");
    if (!rel.startsWith(".")) rel = "./" + rel;
    return `${q}${rel}${q}`;
  });
  if (next !== src) {
    writeFileSync(file, next);
    changed++;
  }
}

console.log(`rewrite-dts-aliases — rewrote @/ imports in ${changed} file(s)`);
