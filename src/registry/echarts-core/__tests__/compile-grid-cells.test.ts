import { describe, expect, it } from "vitest";
import { compileCalendarOption } from "../compile-calendar";
import { compileHeatmapOption } from "../compile-heatmap";
import { CHART_SIGNATURE } from "../chart-signature";
import { resolveCanvasChartChrome } from "../resolve-chart-chrome";
import { makeCtx } from "./make-ctx";

type CellStyle = { borderColor?: string; borderWidth?: number; borderRadius?: number };
const cellStyle = (option: { series?: unknown }) =>
  (option.series as Array<{ itemStyle?: CellStyle }>)[0]!.itemStyle!;

describe("heatmap / calendar cells", () => {
  it("heatmap cells carry the signature radius and a canvas-colour seam", () => {
    const option = compileHeatmapOption(
      makeCtx({
        parts: [
          {
            type: "heatmap",
            id: "h",
            dataKey: "heat",
            cells: [
              { row: "r", col: "c", x: 0, y: 0, value: 1 },
              { row: "r", col: "d", x: 1, y: 0, value: 2 },
            ],
          },
        ],
      }),
    );
    const style = cellStyle(option);
    expect(style.borderWidth).toBe(CHART_SIGNATURE.gap.seam);
    expect(style.borderRadius).toBe(CHART_SIGNATURE.radius.mark);
    expect(style.borderColor).toBeTruthy();
  });

  it("calendar cells match heatmap; the day backdrop paints no border", () => {
    const option = compileCalendarOption(
      makeCtx({
        parts: [
          {
            type: "calendar",
            id: "c",
            dataKey: "util",
            range: "2026-06",
            cells: [{ date: "2026-06-01", value: 10, assignedHours: 4, availableHours: 8 }],
          },
        ],
      }),
    );
    const style = cellStyle(option);
    expect(style.borderWidth).toBe(CHART_SIGNATURE.gap.seam);
    expect(style.borderRadius).toBe(CHART_SIGNATURE.radius.mark);
    expect((option.calendar as { itemStyle?: CellStyle }).itemStyle?.borderWidth).toBe(0);
  });

  it("calendar empty days and month outline follow the theme, not ECharts white / black", () => {
    const option = compileCalendarOption(
      makeCtx({
        parts: [
          {
            type: "calendar",
            id: "c",
            dataKey: "util",
            range: "2026-06",
            cells: [{ date: "2026-06-01", value: 10, assignedHours: 4, availableHours: 8 }],
          },
        ],
      }),
    );
    const calendar = option.calendar as {
      itemStyle?: { color?: string };
      splitLine?: { show?: boolean; lineStyle?: { color?: string } };
    };
    expect(calendar.itemStyle?.color).toBe("transparent");
    expect(calendar.splitLine?.show).toBe(true);
    expect(calendar.splitLine?.lineStyle?.color).toBe(
      resolveCanvasChartChrome("test-chart").splitLine,
    );
  });
});
