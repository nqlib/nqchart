import { describe, expect, it } from "vitest";
import { resolveCssColorValue } from "../resolve-chart-colors";

describe("resolveCssColorValue", () => {
  it("returns concrete colors unchanged", () => {
    expect(resolveCssColorValue("#047857")).toBe("#047857");
    expect(resolveCssColorValue("oklch(0.55 0.23 275)")).toBe("oklch(0.55 0.23 275)");
  });

  it("returns var() unchanged when document is undefined", () => {
    expect(resolveCssColorValue("var(--chart-1)")).toBe("var(--chart-1)");
  });
});
