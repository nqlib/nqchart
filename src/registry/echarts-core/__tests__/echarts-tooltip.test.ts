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
