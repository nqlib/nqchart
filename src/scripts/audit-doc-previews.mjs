#!/usr/bin/env node
/**
 * Lists ComponentPreview `name=` values in docs vs keys in registry __index__.
 * Usage: node src/scripts/audit-doc-previews.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "src/content/docs");
const indexPath = path.join(root, "src/registry/__index__.tsx");

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.name.endsWith(".mdx")) out.push(p);
  }
  return out;
}

// Match name= even when title= contains '>' (e.g. JSX in title attribute)
const previewRe = /name="(ex-[^"]+)"/g;
const refs = new Set();
for (const file of walk(docsDir)) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  while ((m = previewRe.exec(text))) refs.add(m[1]);
}

const index = fs.readFileSync(indexPath, "utf8");
const reg = new Set([...index.matchAll(/^\s+"([^"]+)":\s*\{/gm)].map((m) => m[1]));

const missing = [...refs].filter((r) => !reg.has(r)).sort();
const present = [...refs].filter((r) => reg.has(r)).sort();

console.log(`Doc previews referenced: ${refs.size}`);
console.log(`Registry index entries: ${reg.size}`);
console.log(`\nOK (${present.length}):`);
for (const n of present) console.log(`  ${n}`);
console.log(`\nMissing (${missing.length}):`);
for (const n of missing) console.log(`  ${n}`);
process.exit(missing.length > 0 ? 1 : 0);
