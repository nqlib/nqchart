import { describe, expect, it } from "vitest";
import type { EChartsOption } from "echarts";
import { applyTooltipToOption } from "../echarts-tooltip";
import type { ChartConfig } from "@/registry/ui/chart";

const CONFIG = {
  desktop: {
    label: "Desktop",
    colors: { light: ["#047857"], dark: ["#10b981"] },
  },
} satisfies ChartConfig;

const tooltipPart = { type: "tooltip" as const, id: "tip", variant: "default" as const };

describe("applyTooltipToOption", () => {
  it("prefers compile-selected item trigger over series heuristics", () => {
    const option = {
      tooltip: { trigger: "item" },
      series: [{ type: "line" }],
    } as EChartsOption;

    const next = applyTooltipToOption(option, CONFIG, "chart-1", tooltipPart);
    expect((next.tooltip as { trigger?: string }).trigger).toBe("item");
  });

  it("prefers compile-selected axis trigger", () => {
    const option = {
      tooltip: { trigger: "axis" },
      series: [{ type: "radar" }],
    } as EChartsOption;

    const next = applyTooltipToOption(option, CONFIG, "chart-1", tooltipPart);
    expect((next.tooltip as { trigger?: string }).trigger).toBe("axis");
  });

  it("infers item trigger for radar/scatter/treemap when unset", () => {
    for (const type of ["radar", "scatter", "treemap"] as const) {
      const option = { series: [{ type }] } as EChartsOption;
      const next = applyTooltipToOption(option, CONFIG, "chart-1", tooltipPart);
      expect((next.tooltip as { trigger?: string }).trigger).toBe("item");
    }
  });

  it("formats radar indicator vectors as joined numbers", () => {
    const option = {
      tooltip: { trigger: "item" },
      series: [{ type: "radar" }],
    } as EChartsOption;
    const next = applyTooltipToOption(option, CONFIG, "chart-1", tooltipPart);
    const formatter = (next.tooltip as { formatter?: (p: unknown) => string }).formatter;
    expect(formatter).toBeTypeOf("function");
    const html = formatter!({
      name: "desktop",
      seriesName: "desktop",
      value: [1200, 340, 56],
    });
    expect(html).toContain("1,200 · 340 · 56");
  });

  it("keeps anti-flicker tooltip shell options", () => {
    const option = { series: [{ type: "bar" }] } as EChartsOption;
    const next = applyTooltipToOption(option, CONFIG, "chart-1", tooltipPart);
    const tip = next.tooltip as {
      enterable?: boolean;
      transitionDuration?: number;
      extraCssText?: string;
    };
    expect(tip.enterable).toBe(false);
    expect(tip.transitionDuration).toBe(0);
    expect(tip.extraCssText).toContain("pointer-events:none");
  });
});

/**
 * A chart that declares no `<Tooltip />` still gets ECharts' own tooltip, and
 * `themeNativeTooltip` is what gives it popover colours. That only works if the
 * chrome meant for our HTML card stays off: the card chrome sets
 * `backgroundColor: "transparent"`, and the themer preserves an explicit
 * background rather than overwriting it — so applying it unconditionally left
 * the bubble-size chart's tooltip as text floating on nothing.
 */
describe("tooltip chrome follows the formatter", () => {
  const bare = () =>
    ({ series: [{ type: "scatter" }] }) as EChartsOption;

  it("keeps ECharts' own box when no Tooltip part is declared", () => {
    const t = applyTooltipToOption(bare(), CONFIG, "chart-1", undefined).tooltip as Record<
      string,
      unknown
    >;
    expect(t.backgroundColor).toBeUndefined();
    expect(t.padding).toBeUndefined();
    expect(t.borderWidth).toBeUndefined();
    expect(t.extraCssText).toBeUndefined();
    // No formatter either — the default content is what gets drawn.
    expect(t.formatter).toBeUndefined();
  });

  it("strips the box only when a formatter draws the card", () => {
    const t = applyTooltipToOption(bare(), CONFIG, "chart-1", tooltipPart).tooltip as Record<
      string,
      unknown
    >;
    expect(t.backgroundColor).toBe("transparent");
    expect(t.padding).toBe(0);
    expect(t.borderWidth).toBe(0);
    expect(typeof t.formatter).toBe("function");
  });

  it("keeps placement behaviour in both cases", () => {
    for (const part of [undefined, tooltipPart]) {
      const t = applyTooltipToOption(bare(), CONFIG, "chart-1", part).tooltip as Record<
        string,
        unknown
      >;
      expect(t.confine).toBe(true);
      expect(t.enterable).toBe(false);
      expect(typeof t.position).toBe("function");
    }
  });

  it("still honours an explicit hide", () => {
    const t = applyTooltipToOption(bare(), CONFIG, "chart-1", {
      ...tooltipPart,
      hide: true,
    }).tooltip as Record<string, unknown>;
    expect(t.show).toBe(false);
  });
});
