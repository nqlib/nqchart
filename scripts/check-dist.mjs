#!/usr/bin/env node
/**
 * Fail if the published library bundle still references process.env.*
 * (e.g. Next.js NEXT_PUBLIC_* leaking from docs-site helpers into cn()'s module).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(dist)) {
  console.error("check:dist — missing dist/. Run build:lib / build:npm first.");
  process.exit(1);
}

const PROCESS_ENV = /process\.env\./;
const hits = [];

for (const name of readdirSync(dist)) {
  if (!/\.(mjs|cjs)$/.test(name)) continue;
  const file = join(dist, name);
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (PROCESS_ENV.test(lines[i])) {
      hits.push(`${name}:${i + 1}: ${lines[i].trim()}`);
    }
  }
}

if (hits.length > 0) {
  console.error("check:dist — process.env. found in library dist:\n");
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.info("check:dist — ok (no process.env. in dist/*.mjs|*.cjs)");
