import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src/registry");
const FORBIDDEN = '@/components/';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|mts|js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const violations = [];

for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, "utf8");
  if (text.includes(FORBIDDEN)) {
    violations.push(path.relative(process.cwd(), file));
  }
}

if (violations.length) {
  console.error("Registry boundary violations (imports from src/components):");
  for (const file of violations) console.error(`  - ${file}`);
  process.exit(1);
}

console.log("Registry boundary check passed.");
