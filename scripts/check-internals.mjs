#!/usr/bin/env node
/**
 * Fail if a private echarts/lib path NQChart imports has moved.
 * Hover-focus and rollout-intro depend on these; there is no public equivalent.
 *
 * Verified against echarts 5.6.0 (the installed peer). The peer range is ^5.6.0.
 *
 * Also fail if React reaches the compile path (plan 018): the compile path imports
 * no React module; a Node consumer runs it with no DOM.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

const PATHS = [
  "echarts/lib/util/states.js",
  "echarts/lib/animation/basicTransition.js",
  "echarts/lib/util/graphic.js",
];

const echartsPkg = require("echarts/package.json");
const missing = [];

for (const spec of PATHS) {
  try {
    require.resolve(spec);
  } catch {
    missing.push(spec);
  }
}

if (missing.length) {
  console.error(
    `check:internals — private echarts path missing (installed echarts@${echartsPkg.version}):\n  ${missing.join("\n  ")}`,
  );
  process.exit(1);
}

// Cheap export smoke — a moved file that still resolves but dropped the symbol
// would otherwise fail only in a consumer runtime.
const states = require("echarts/lib/util/states.js");
const transition = require("echarts/lib/animation/basicTransition.js");
const graphic = require("echarts/lib/util/graphic.js");
const needed = [
  ["echarts/lib/util/states.js", states, ["enterBlur", "enterEmphasis", "leaveBlur", "leaveEmphasis"]],
  ["echarts/lib/animation/basicTransition.js", transition, ["initProps"]],
  ["echarts/lib/util/graphic.js", graphic, ["Rect"]],
];
const dropped = [];
for (const [spec, mod, names] of needed) {
  for (const name of names) {
    if (typeof mod[name] !== "function") dropped.push(`${spec}#${name}`);
  }
}
if (dropped.length) {
  console.error(
    `check:internals — export missing (installed echarts@${echartsPkg.version}):\n  ${dropped.join("\n  ")}`,
  );
  process.exit(1);
}

// --- The compile path imports no React module (plan 018) -----------------------

const REACT_IMPORT = /(?:from\s*|import\s*\(\s*|require\(\s*|import\s+)["'](?:react|react-dom)(?:\/[^"']*)?["']/;

function listFiles(dir, recursive) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) {
      if (recursive && name !== "__tests__") out.push(...listFiles(file, recursive));
    } else if (/\.ts$/.test(name) && !/\.test\.ts$/.test(name)) {
      out.push(file);
    }
  }
  return out;
}

const coreDir = join(root, "src", "registry", "echarts-core");
const headlessDir = join(root, "src", "registry", "headless");
// The React hooks (`use-*.ts`) live beside the compilers but are not on the compile path.
const sources = [
  ...listFiles(coreDir, false).filter((f) => !/[\\/]use-[^\\/]+\.ts$/.test(f)),
  ...listFiles(headlessDir, true),
];
const reactHits = sources.filter((f) => REACT_IMPORT.test(readFileSync(f, "utf8")));

// Walk the value imports from the headless entry: no `.tsx` file and no React module.
function resolveSource(from, spec) {
  const base = spec.startsWith("@/") ? join(root, "src", spec.slice(2)) : resolve(dirname(from), spec);
  for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}
const graphHits = [];
const headlessEntry = join(headlessDir, "index.ts");
if (existsSync(headlessEntry)) {
  const seen = new Set();
  const stack = [headlessEntry];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/^(?:import|export)\s+(type\s+)?[^;]*?from\s+["']([^"']+)["']/gms)) {
      if (m[1]) continue;
      const spec = m[2];
      if (!spec.startsWith(".") && !spec.startsWith("@/")) {
        if (!spec.startsWith("echarts")) graphHits.push(`${relative(root, file)} -> ${spec}`);
        continue;
      }
      const target = resolveSource(file, spec);
      if (!target) continue;
      if (target.endsWith(".tsx")) graphHits.push(`${relative(root, file)} -> ${relative(root, target)}`);
      stack.push(target);
    }
  }
}

// The built headless entry and every chunk it loads hold no React import.
const distHits = [];
const distHeadless = ["headless.mjs", "headless.cjs"].map((n) => join(root, "dist", n));
for (const entryFile of distHeadless.filter((f) => existsSync(f))) {
  const seen = new Set();
  const stack = [entryFile];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const text = readFileSync(file, "utf8");
    if (REACT_IMPORT.test(text)) distHits.push(relative(root, file));
    for (const m of text.matchAll(/(?:from\s*|require\(\s*)["'](\.\/[^"']+)["']/g)) {
      stack.push(join(dirname(file), m[1]));
    }
  }
}
if (existsSync(join(root, "dist")) && !distHeadless.every((f) => existsSync(f))) {
  distHits.push("dist/headless.mjs or dist/headless.cjs is missing");
}

const pureHits = [...reactHits.map((f) => relative(root, f)), ...graphHits, ...distHits];
if (pureHits.length) {
  console.error(
    `check:internals — React on the compile path (plan 018):\n  ${[...new Set(pureHits)].join("\n  ")}`,
  );
  process.exit(1);
}

console.info(
  `check:internals — ok (echarts@${echartsPkg.version}; ${PATHS.length} private paths; compile path has no React)`,
);
