import { describe, expect, it } from "vitest";
import { compileRadialOption } from "../compile-radial";
import type { GaugePart, RadialBarPart } from "../parts/types";
import { makeCtx } from "./make-ctx";

const radialBarPart: RadialBarPart = {
  type: "radialBar",
  id: "radial-1",
  dataKey: "visitors",
};

const gaugePart: GaugePart = {
  type: "gauge",
  id: "gauge-1",
  dataKey: "value",
  target: 80,
};

describe("compileRadialOption", () => {
  it("routes single-row data to gauge series", () => {
    const option = compileRadialOption(
      makeCtx({
        parts: [gaugePart],
        nameKey: "series",
        data: [{ series: "score", value: 72 }],
        radial: { radialVariant: "semi" },
      }),
    );

    const series = option.series as Array<{ type?: string; emphasis?: { disabled?: boolean } }>;
    expect(series[0]?.type).toBe("gauge");
    expect(series[0]?.emphasis?.disabled).toBe(true);
    expect(series[1]?.type).toBe("gauge");
  });

  it("models each ring as its own series with instant series focus", () => {
    const option = compileRadialOption(
      makeCtx({
        parts: [radialBarPart],
        nameKey: "browser",
        data: [
          { browser: "chrome", visitors: 275 },
          { browser: "safari", visitors: 200 },
        ],
        radial: { radialVariant: "full" },
        config: {
          chrome: { label: "Chrome" },
          safari: { label: "Safari" },
        },
      }),
    );

    const series = option.series as Array<{
      type?: string;
      id?: string;
      emphasis?: { focus?: string; disabled?: boolean; itemStyle?: { opacity?: number } };
      blur?: { itemStyle?: { opacity?: number } };
      stateAnimation?: { duration?: number };
      animationDurationUpdate?: number;
    }>;

    const rings = series.filter((s) => s.id !== "__radial_track__");
    expect(rings).toHaveLength(2);
    for (const ring of rings) {
      expect(ring.type).toBe("bar");
      expect(ring.emphasis?.focus).toBe("series");
      expect(ring.emphasis?.disabled).toBe(true);
      expect(ring.emphasis?.itemStyle?.opacity).toBe(1);
      expect(ring.blur?.itemStyle?.opacity).toBe(0.2);
      expect(ring.stateAnimation?.duration).toBe(0);
      expect(ring.animationDurationUpdate).toBe(0);
    }
  });

  it("keeps track on the same stack as rings so polar band width is shared", () => {
    const option = compileRadialOption(
      makeCtx({
        parts: [radialBarPart],
        nameKey: "browser",
        data: [
          { browser: "chrome", visitors: 275 },
          { browser: "safari", visitors: 200 },
          { browser: "firefox", visitors: 187 },
          { browser: "edge", visitors: 173 },
          { browser: "other", visitors: 90 },
        ],
        radial: { radialVariant: "full" },
        config: {
          chrome: { label: "Chrome" },
          safari: { label: "Safari" },
          firefox: { label: "Firefox" },
          edge: { label: "Edge" },
          other: { label: "Other" },
        },
      }),
    );

    const series = option.series as Array<{
      id?: string;
      stack?: string;
      showBackground?: boolean;
      barWidth?: number;
      data?: unknown[];
    }>;
    const track = series.find((s) => s.id === "__radial_track__");
    const rings = series.filter((s) => s.id !== "__radial_track__");

    expect(track?.stack).toBe("ring");
    expect(track?.showBackground).toBe(true);
    expect(track?.barWidth).toBe(14);
    expect(rings).toHaveLength(5);
    for (const ring of rings) {
      expect(ring.stack).toBe("ring");
      expect(ring.barWidth).toBe(14);
    }
  });

  it("renders ring names on the radiusAxis (not in-bar), with ring gaps", () => {
    const option = compileRadialOption(
      makeCtx({
        data: [
          { browser: "chrome", visitors: 100 },
          { browser: "safari", visitors: 80 },
        ],
        nameKey: "browser",
        parts: [{ type: "radialBar", id: "rb1", dataKey: "visitors" }],
        config: { chrome: { label: "Chrome" }, safari: { label: "Safari" } },
      }),
    );

    const radiusAxis = option.radiusAxis as {
      data?: string[];
      z?: number;
      silent?: boolean;
      axisLabel?: {
        show?: boolean;
        interval?: number;
        rotate?: number;
        fontSize?: number;
        hideOverlap?: boolean;
        margin?: number;
      };
    };
    const series = option.series as Array<{
      id?: string;
      z?: number;
      label?: { show?: boolean };
      barCategoryGap?: string | number;
      barWidth?: number;
    }>;
    const rings = series.filter((s) => s.id !== "__radial_track__");
    const track = series.find((s) => s.id === "__radial_track__");

    expect(radiusAxis.axisLabel?.show).toBe(true);
    expect(radiusAxis.axisLabel?.interval).toBe(0);
    expect(radiusAxis.axisLabel?.hideOverlap).toBe(true);
    expect(radiusAxis.axisLabel?.margin).toBeGreaterThanOrEqual(12);
    expect(radiusAxis.data).toEqual(["Chrome", "Safari"]);
    // Glyph height stays under the default 14px ring thickness.
    expect(radiusAxis.axisLabel?.fontSize).toBeLessThanOrEqual(10);
    expect(track?.barCategoryGap).toBe("48%");
    // Names above rings; silent so hover still hits the arcs.
    expect(radiusAxis.silent).toBe(true);
    expect(radiusAxis.z).toBeGreaterThan(Math.max(...rings.map((r) => r.z ?? 0)));
    for (const ring of rings) {
      expect(ring.label?.show).toBe(false);
      expect(ring.barCategoryGap).toBe("48%");
    }
  });

  // Label baseline is perpendicular to the start spoke (rotate = startAngle − 90)
  // so glyph height fits the ring band; polar keeps a thin gutter (not half-empty).
  it.each([
    ["full", 90, 0, "90%"],
    ["semi", 180, 90, "85%"],
  ])(
    "rotates %s-variant ring names from startAngle and insets polar",
    (variant, startAngle, labelRotate, outer) => {
      const option = compileRadialOption(
        makeCtx({
          data: [
            { browser: "chrome", visitors: 100 },
            { browser: "safari", visitors: 80 },
          ],
          nameKey: "browser",
          parts: [{ type: "radialBar", id: "rb1", dataKey: "visitors" }],
          radial: { radialVariant: variant as "full" | "semi" },
          config: { chrome: { label: "Chrome" }, safari: { label: "Safari" } },
        }),
      );

      const axisLabel = (
        option.radiusAxis as { axisLabel?: { rotate?: number; margin?: number } }
      ).axisLabel!;
      const angleAxis = option.angleAxis as { startAngle?: number; endAngle?: number };
      const polar = option.polar as { radius?: Array<string | number> | string | number };

      expect(axisLabel.rotate).toBe(labelRotate);
      expect(axisLabel.margin).toBeGreaterThan(0);
      expect(angleAxis.startAngle).toBe(startAngle);
      expect(polar.radius).toEqual(["18%", outer]);
    },
  );

  it("tilts ring names when startAngle is custom (e.g. 45° from +X)", () => {
    const option = compileRadialOption(
      makeCtx({
        data: [
          { browser: "chrome", visitors: 100 },
          { browser: "safari", visitors: 80 },
        ],
        nameKey: "browser",
        parts: [{ type: "radialBar", id: "rb1", dataKey: "visitors" }],
        radial: { radialVariant: "full", radialStartAngle: 45 },
        config: { chrome: { label: "Chrome" }, safari: { label: "Safari" } },
      }),
    );

    const angleAxis = option.angleAxis as { startAngle?: number; endAngle?: number };
    const axisLabel = (option.radiusAxis as { axisLabel?: { rotate?: number } }).axisLabel!;

    expect(angleAxis.startAngle).toBe(45);
    expect(angleAxis.endAngle).toBe(45 - 360);
    // Perpendicular to the 45° spoke → −45° (normalized 315).
    expect(axisLabel.rotate).toBe(315);
  });

  // Polar bar series have no `labelLine` (only pie/funnel views do), so rose
  // names ride an invisible pie sharing the petals' angular layout.
  describe("rose leader lines", () => {
    const roseOption = (showLabels?: boolean) =>
      compileRadialOption(
        makeCtx({
          data: [
            { browser: "chrome", visitors: 100 },
            { browser: "safari", visitors: 80 },
            { browser: "firefox", visitors: 60 },
          ],
          nameKey: "browser",
          parts: [
            {
              type: "radialBar",
              id: "rb1",
              dataKey: "visitors",
              ...(showLabels != null ? { showLabels } : {}),
            },
          ],
          radial: { radialLayout: "rose" },
          config: {
            chrome: { label: "Chrome" },
            safari: { label: "Safari" },
            firefox: { label: "Firefox" },
          },
        }),
      );

    type LabelPie = {
      id?: string;
      type?: string;
      startAngle?: number;
      silent?: boolean;
      radius?: string | number | Array<string | number>;
      avoidLabelOverlap?: boolean;
      label?: { overflow?: string; distanceToLabelLine?: number };
      labelLine?: { show?: boolean; length?: number; length2?: number };
      labelLayout?: { hideOverlap?: boolean; moveOverlap?: string };
      data?: Array<{ name?: string; value?: number }>;
    };

    const labelSeries = (option: ReturnType<typeof roseOption>) =>
      (option.series as LabelPie[]).find((s) => s.id === "__rose_labels__");

    it("draws names on a silent pie with leader lines", () => {
      const labels = labelSeries(roseOption())!;

      expect(labels.type).toBe("pie");
      expect(labels.silent).toBe(true);
      expect(labels.labelLine?.show).toBe(true);
      expect(labels.data?.map((d) => d.name)).toEqual(["Chrome", "Safari", "Firefox"]);
    });

    it("offsets leaders from the petals and enables collision layout", () => {
      const labels = labelSeries(roseOption())!;

      expect(labels.avoidLabelOverlap).toBe(true);
      expect(labels.labelLayout?.hideOverlap).toBe(true);
      expect(labels.labelLayout?.moveOverlap).toBe("shiftY");
      expect(labels.labelLine?.length).toBeGreaterThanOrEqual(16);
      expect(labels.label?.distanceToLabelLine).toBeGreaterThan(0);
    });

    it("aligns the label pie to the petal angular bands", () => {
      const option = roseOption();
      const labels = labelSeries(option)!;
      const angleAxis = option.angleAxis as { startAngle?: number };

      expect(new Set(labels.data?.map((d) => d.value)).size).toBe(1);
      expect(labels.startAngle).toBe(angleAxis.startAngle);
    });

    it("insets polar so leaders fit outside the petals", () => {
      const option = roseOption();
      const polar = option.polar as { radius?: string | number | Array<string | number> };
      const labels = labelSeries(option)!;

      expect(polar.radius).toBe("78%");
      expect(labels.radius).toBe("78%");
      expect(labels.label?.overflow).toBe("none");
    });

    it("replaces the angleAxis labels rather than doubling them", () => {
      const axisLabel = (roseOption().angleAxis as { axisLabel?: { show?: boolean } })
        .axisLabel;
      expect(axisLabel?.show).toBe(false);
    });

    it("omits the label series when showLabels is off", () => {
      expect(labelSeries(roseOption(false))).toBeUndefined();
    });

    it("uses full radius when labels are off", () => {
      const polar = roseOption(false).polar as {
        radius?: string | number | Array<string | number>;
      };
      expect(polar.radius).toBe("100%");
    });
  });

  it("hides ring names when showLabels is off", () => {
    const option = compileRadialOption(
      makeCtx({
        data: [
          { browser: "chrome", visitors: 100 },
          { browser: "safari", visitors: 80 },
        ],
        nameKey: "browser",
        parts: [{ type: "radialBar", id: "rb1", dataKey: "visitors", showLabels: false }],
        config: { chrome: { label: "Chrome" }, safari: { label: "Safari" } },
      }),
    );

    const radiusAxis = option.radiusAxis as { axisLabel?: { show?: boolean } };
    expect(radiusAxis.axisLabel?.show).toBe(false);
  });
});
