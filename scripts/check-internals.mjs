#!/usr/bin/env node
/**
 * Fail if a private echarts/lib path NQChart imports has moved.
 * Hover-focus and rollout-intro depend on these; there is no public equivalent.
 *
 * Verified against echarts 5.6.0 (the installed peer). The peer range is ^5.6.0.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
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

console.info(
  `check:internals — ok (echarts@${echartsPkg.version}; ${PATHS.length} private paths)`,
);
