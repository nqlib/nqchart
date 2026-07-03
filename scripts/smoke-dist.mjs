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
];

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

if (failed) {
  console.error(`\nsmoke-dist — ${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nsmoke-dist — all built artifacts OK");
