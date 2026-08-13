import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { barBorderRadius } from "./bar-radius";
import { resolveChartBarCornerRadius } from "./chart-corner-radius";
import { waterfallColumnFocus } from "./emphasis-presets";
import { resolveCartesianGrid } from "./chart-grid";
import { buildCategoryDataZoom, gridBottomWithZoom } from "./category-data-zoom";
import { NQ_DATUM, NQ_SERIES_KEY } from "./nq-mark-event";
import type { CompileContext, WaterfallPart, WaterfallRow } from "./parts/types";

export function compileWaterfallOption(ctx: CompileContext): EChartsOption {
  const wf = ctx.parts.find((p): p is WaterfallPart => p.type === "waterfall");
  const nameKey = wf?.nameKey ?? ctx.nameKey ?? "name";
  const valueKey = wf?.valueKey ?? ctx.valueKey ?? "value";
  const typeKey = wf?.typeKey ?? "type";
  const hasGrid = ctx.parts.some((p) => p.type === "grid");
  const hasBrush = ctx.parts.some((p) => p.type === "brush");

  const rows = ctx.data as WaterfallRow[];
  let running = 0;
  const placeholders: number[] = [];
  const values: number[] = [];
  const categories: string[] = [];
  const colors: string[] = [];

  for (const row of rows) {
    const record = row as Record<string, unknown>;
    const name = String(record[nameKey] ?? "");
    const value = Number(record[valueKey] ?? 0);
    const kind = (record[typeKey] ?? record.type) as WaterfallRow["type"];
    categories.push(ctx.config[name]?.label?.toString() ?? name);

    if (kind === "start" || kind === "total") {
      placeholders.push(0);
      values.push(value);
      running = value;
    } else if (value < 0) {
      placeholders.push(running + value);
      values.push(-value);
      running += value;
    } else {
      placeholders.push(running);
      values.push(value);
      running += value;
    }
    colors.push(ctx.resolveColor(name, 0));
  }

  const dataZoom = buildCategoryDataZoom(hasBrush, { chartVariant: "waterfall" });
  const base: EChartsOption = {
    grid: resolveCartesianGrid(ctx.parts, ctx.cartesian?.externalBrush, gridBottomWithZoom(hasBrush)),
    tooltip: { trigger: "axis" },
    legend: { show: false },
    xAxis: { type: "category", data: categories },
    yAxis: { type: "value", splitLine: { show: hasGrid } },
    ...(dataZoom ? { dataZoom } : {}),
    series: [
      {
        type: "bar",
        id: "__wf_placeholder__",
        name: "__wf_placeholder__",
        stack: "wf",
        silent: true,
        animation: false,
        itemStyle: { color: "rgba(0,0,0,0)", borderColor: "rgba(0,0,0,0)" },
        emphasis: { disabled: true },
        tooltip: { show: false },
        data: placeholders,
      },
      {
        type: "bar",
        id: "__wf_values__",
        name: "__wf_values__",
        stack: "wf",
        ...waterfallColumnFocus(),
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: colors[i],
            borderRadius: barBorderRadius(resolveChartBarCornerRadius(ctx.chartId), false),
          },
          [NQ_SERIES_KEY]: valueKey,
          [NQ_DATUM]: rows[i] as Record<string, unknown>,
        })),
      },
    ],
  };

  return applyChartUiToOption(ctx, base);
}
