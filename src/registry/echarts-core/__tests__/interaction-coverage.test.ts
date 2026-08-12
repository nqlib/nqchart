import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every chart family must accept the BI interaction contract.
 *
 * This gap went unnoticed because nothing asserted it: six of the fourteen
 * families — calendar, heatmap, radar, radial, sparkline, treemap — rendered
 * perfectly and accepted neither `chartRef` nor `onMarkClick`, so they could be
 * drawn but never filtered, drilled into or exported. A chart you cannot click
 * is a picture, not a BI component.
 *
 * The check is deliberately source-level: props are not introspectable at
 * runtime, and what matters is that the root *declares* the contract. A new
 * family added without it fails here rather than in a consumer's dashboard.
 */
const CHARTS_DIR = join(import.meta.dirname, "../../charts");

const families = readdirSync(CHARTS_DIR)
  .filter((f) => f.endsWith("-chart.tsx"))
  .map((file) => ({ file, source: readFileSync(join(CHARTS_DIR, file), "utf8") }));

describe("BI interaction contract", () => {
  it("covers every chart family in the registry", () => {
    // Guards against the list silently shrinking and the suite passing vacuously.
    expect(families.length).toBeGreaterThanOrEqual(14);
  });

  it.each(families)("$file exposes onMarkClick", ({ source }) => {
    expect(source).toContain("onMarkClick");
  });

  it.each(families)("$file exposes chartRef", ({ source }) => {
    expect(source).toContain("chartRef");
  });

  it.each(families)("$file states the mark cursor both ways", ({ source }) => {
    // `withMarkPointerCursor` is what stops a chart with no handler from
    // advertising a pointer it will not honour. The cartesian families get it
    // from `createCartesianChart` rather than calling it themselves.
    const applies =
      source.includes("withMarkPointerCursor") || source.includes("createCartesianChart");
    expect(applies).toBe(true);
  });
});
