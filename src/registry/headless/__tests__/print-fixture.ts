import { createColorResolver } from "@/registry/echarts-core/resolve-chart-colors";
import type { HeadlessTheme } from "@/registry/echarts-core/headless-theme";
import type { ChartPart, CompileContext, LegendPart } from "@/registry/echarts-core/parts/types";

export const PRINT_THEME: HeadlessTheme = {
  isDark: false,
  chrome: {
    foreground: "#1a2b3c",
    background: "#ffffff",
    muted: "#5b6470",
    border: "#e3e6ea",
    splitLine: "#e3e6ea",
    popover: "#ffffff",
    popoverForeground: "#1a2b3c",
  },
  tones: {
    neutral: "#6b7280",
    accent: "#2563eb",
    positive: "#16a34a",
    warning: "#d97706",
    critical: "#dc2626",
  },
  tokens: { "--metric-plan": "#1d4ed8" },
  radiusPx: 8,
  fontFamily: "Inter, sans-serif",
  animation: false,
};

export const LEGEND: LegendPart = { type: "legend", id: "legend", align: "center" };

/** Three rows, one bar and one dashed line, and a legend. */
export function composedPrintCtx(chartId = "print-composed"): CompileContext {
  const config = {
    actual: { label: "Actual hours", colors: { light: ["#f97316"] } },
    plan: { label: "Planned hours", colors: { light: ["var(--metric-plan)"] } },
  };
  const parts: ChartPart[] = [
    { type: "grid", id: "grid" },
    { type: "xAxis", id: "x", dataKey: "month" },
    { type: "yAxis", id: "y" },
    { type: "bar", id: "bar", dataKey: "actual" },
    { type: "line", id: "line", dataKey: "plan", variant: "dashed" },
    LEGEND,
  ];
  return {
    chartId,
    config,
    parts,
    xDataKey: "month",
    data: [
      { month: "Jan", actual: 40, plan: 50 },
      { month: "Feb", actual: 55, plan: 50 },
      { month: "Mar", actual: 62, plan: 60 },
    ],
    resolveColor: createColorResolver(chartId, config),
  };
}

/** A donut: pie with a 55 % inner radius. */
export function donutPrintCtx(chartId = "print-donut"): CompileContext {
  const config = {
    open: { label: "Open", colors: { light: ["#0ea5e9"] } },
    closed: { label: "Closed", colors: { light: ["#22c55e"] } },
    late: { label: "Late", colors: { light: ["#ef4444"] } },
  };
  return {
    chartId,
    config,
    parts: [{ type: "pie", id: "pie", dataKey: "value", nameKey: "status", innerRadius: "55%" }, LEGEND],
    nameKey: "status",
    data: [
      { status: "open", value: 12 },
      { status: "closed", value: 30 },
      { status: "late", value: 5 },
    ],
    resolveColor: createColorResolver(chartId, config),
  };
}
