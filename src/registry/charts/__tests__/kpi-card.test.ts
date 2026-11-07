import { describe, expect, it } from "vitest";
import {
  formatKpiDelta,
  formatKpiNumber,
  kpiAriaLabel,
  kpiDirection,
  kpiProgress,
  kpiTone,
  resolveKpiDelta,
} from "../kpi-card";

describe("resolveKpiDelta", () => {
  it("derives a percent change from previousValue", () => {
    const d = resolveKpiDelta({ value: 112, previousValue: 100 });
    expect(d?.format).toBe("percent");
    expect(d?.value).toBeCloseTo(0.12);
    expect(d?.direction).toBe("up");
  });

  it("derives an absolute change when asked", () => {
    expect(resolveKpiDelta({ value: 80, previousValue: 100, deltaFormat: "absolute" })).toEqual({
      value: -20,
      format: "absolute",
      direction: "down",
    });
  });

  it("divides by |previous| so a negative base improving reads as up", () => {
    const d = resolveKpiDelta({ value: -5, previousValue: -10 });
    expect(d?.value).toBeCloseTo(0.5);
    expect(d?.direction).toBe("up");
  });

  it("falls back to absolute when previousValue is 0", () => {
    expect(resolveKpiDelta({ value: 40, previousValue: 0 })).toEqual({
      value: 40,
      format: "absolute",
      direction: "up",
    });
    expect(resolveKpiDelta({ value: 0, previousValue: 0 })?.direction).toBe("flat");
  });

  it("prefers an explicit delta over previousValue", () => {
    expect(resolveKpiDelta({ value: 10, previousValue: 5, delta: -0.03 })).toEqual({
      value: -0.03,
      format: "percent",
      direction: "down",
    });
  });

  it("returns null with nothing to compare or non-finite input", () => {
    expect(resolveKpiDelta({ value: 10 })).toBeNull();
    expect(resolveKpiDelta({ value: Number.NaN, previousValue: 1 })).toBeNull();
    expect(resolveKpiDelta({ value: 1, delta: Number.POSITIVE_INFINITY })).toBeNull();
  });
});

describe("kpiDirection", () => {
  it("treats a percent that rounds to 0.0% as flat", () => {
    expect(kpiDirection(0.0004, "percent")).toBe("flat");
    expect(kpiDirection(0.001, "percent")).toBe("up");
  });
  it("is exact for absolute deltas", () => {
    expect(kpiDirection(0, "absolute")).toBe("flat");
    expect(kpiDirection(0.0001, "absolute")).toBe("up");
    expect(kpiDirection(-1, "absolute")).toBe("down");
  });
});

describe("kpiTone", () => {
  it("higherIsBetter (default): up good, down bad", () => {
    expect(kpiTone("up")).toBe("positive");
    expect(kpiTone("down")).toBe("negative");
  });
  it("higherIsBetter=false inverts", () => {
    expect(kpiTone("up", false)).toBe("negative");
    expect(kpiTone("down", false)).toBe("positive");
  });
  it("flat is always neutral", () => {
    expect(kpiTone("flat", true)).toBe("neutral");
    expect(kpiTone("flat", false)).toBe("neutral");
  });
});

describe("formatting", () => {
  it("formats the value with grouped digits", () => {
    expect(formatKpiNumber(1234567.891, "en-US")).toBe("1,234,567.89");
  });
  it("formats a percent delta unsigned with one decimal", () => {
    expect(
      formatKpiDelta({ value: -0.1234, format: "percent", direction: "down" }, undefined, "en-US"),
    ).toBe("12.3%");
    expect(
      formatKpiDelta({ value: 0.05, format: "percent", direction: "up" }, undefined, "en-US"),
    ).toBe("5%");
  });
  it("formats an absolute delta with the card's formatter", () => {
    const usd = (v: number) => `$${v}K`;
    expect(formatKpiDelta({ value: -120, format: "absolute", direction: "down" }, usd)).toBe(
      "$120K",
    );
  });
});

describe("kpiProgress", () => {
  it("clamps to [0, 1]", () => {
    expect(kpiProgress(50, 200)).toBe(0.25);
    expect(kpiProgress(300, 200)).toBe(1);
    expect(kpiProgress(-5, 200)).toBe(0);
  });
  it("is null without a positive target", () => {
    expect(kpiProgress(5, 0)).toBeNull();
    expect(kpiProgress(5, -1)).toBeNull();
  });
});

describe("kpiAriaLabel", () => {
  it("summarises value, delta, comparison and tone", () => {
    expect(
      kpiAriaLabel({
        label: "Churn",
        formattedValue: "2.1%",
        delta: { value: -0.08, format: "percent", direction: "down" },
        formattedDelta: "8%",
        tone: "positive",
        comparisonLabel: "vs last month",
      }),
    ).toBe("Churn: 2.1%, down 8% vs last month (favorable)");
  });
  it("says unchanged for flat and appends target progress", () => {
    expect(
      kpiAriaLabel({
        label: "Pipeline",
        formattedValue: "$3.6M",
        delta: { value: 0, format: "percent", direction: "flat" },
        formattedDelta: "0%",
        tone: "neutral",
        progress: 0.72,
        formattedTarget: "$5M",
      }),
    ).toBe("Pipeline: $3.6M, unchanged, 72% of target $5M");
  });
});
