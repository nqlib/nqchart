import { describe, expect, it } from "vitest";
import type { EChartsOption } from "echarts";
import { compileComposedOption } from "@/registry/echarts-core/compile-composed";
import { withHeadlessTheme } from "@/registry/echarts-core/headless-theme";
import type { ChartPart } from "@/registry/echarts-core/parts/types";
import { PRINT_LEGEND_HEIGHT_PX, printLegend } from "../print-legend";
import { composedPrintCtx, LEGEND, PRINT_THEME } from "./print-fixture";

type Legend = {
  show?: boolean;
  bottom?: number;
  left?: string;
  icon?: string;
  data?: Array<{ name: string; icon?: string }>;
  textStyle?: { color?: string };
};

function legendOf(option: EChartsOption): Legend {
  return option.legend as Legend;
}

describe("printLegend", () => {
  it("gives a bar a block icon and a line no icon, in part order", () => {
    const ctx = composedPrintCtx();
    const option = withHeadlessTheme(ctx.chartId, PRINT_THEME, () =>
      printLegend(ctx, LEGEND, compileComposedOption(ctx)),
    );
    const legend = legendOf(option);
    expect(legend.show).toBe(true);
    expect(legend.bottom).toBe(0);
    expect(legend.left).toBe("center");
    expect(legend.icon).toBeUndefined();
    expect(legend.textStyle?.color).toBe(PRINT_THEME.chrome.foreground);
    expect(legend.data).toEqual([
      { name: "Actual hours", icon: "roundRect" },
      { name: "Planned hours", itemStyle: { opacity: 0 } },
    ]);
  });

  it("raises grid.bottom by the legend height", () => {
    const ctx = composedPrintCtx();
    const compiled = compileComposedOption(ctx);
    const before = (compiled.grid as { bottom: number }).bottom;
    const option = printLegend(ctx, LEGEND, compiled);
    expect((option.grid as { bottom: number }).bottom).toBe(before + PRINT_LEGEND_HEIGHT_PX);
  });

  it("leaves out a series with showInLegend false", () => {
    const ctx = composedPrintCtx();
    const parts = ctx.parts.map((p): ChartPart =>
      p.type === "line" ? { ...p, showInLegend: false } : p,
    );
    const option = printLegend({ ...ctx, parts }, LEGEND, compileComposedOption({ ...ctx, parts }));
    expect(legendOf(option).data?.map((d) => d.name)).toEqual(["Actual hours"]);
  });

  it("returns the option as given with no legend part or a hidden one", () => {
    const ctx = composedPrintCtx();
    const compiled = compileComposedOption(ctx);
    expect(printLegend(ctx, undefined, compiled)).toBe(compiled);
    expect(printLegend(ctx, { ...LEGEND, hide: true }, compiled)).toBe(compiled);
  });
});
