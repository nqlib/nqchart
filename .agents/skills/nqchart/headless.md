# Headless render (Node, no DOM)

`@nqlib/nqchart/headless` (0.4.0+) compiles a chart from the same parts the React roots use and draws it to an **SVG string** in Node. No browser, no React render, no DOM. Use it for a PDF export, an e-mail image, or a server-side thumbnail.

The browser roots (`NQBarChart`, …) are unchanged. Do not use this entry inside a React app; use the chart roots there.

## Install

```bash
npm i @nqlib/nqchart echarts
```

`echarts` (`^5.6.0`) is the renderer. React and motion stay declared peers of the package, but nothing in this entry imports them at runtime.

## Recipe: register a theme, compile, print legend, render

```ts
import {
  compileComposedOption,
  compilePieOption,
  createColorResolver,
  printLegend,
  renderToSvg,
  withHeadlessTheme,
  type CompileContext,
  type HeadlessTheme,
  type LegendPart,
} from "@nqlib/nqchart/headless";

// Concrete colours: ECharts in Node cannot resolve CSS variables.
const theme: HeadlessTheme = {
  isDark: false,
  chrome: {
    foreground: "#1a2b3c", background: "#ffffff", muted: "#5b6470",
    border: "#e3e6ea", splitLine: "#e3e6ea", popover: "#ffffff", popoverForeground: "#1a2b3c",
  },
  tones: { neutral: "#6b7280", accent: "#2563eb", positive: "#16a34a", warning: "#d97706", critical: "#dc2626" },
  tokens: { "--metric-plan": "#1d4ed8" }, // resolves var(--metric-plan) in the config
  radiusPx: 8,                             // your --radius in px; null for the default
  fontFamily: "Inter, sans-serif",
  animation: false,
};

const chartId = "export-1";
const config = {
  actual: { label: "Actual hours", colors: { light: ["#f97316"] } },
  plan: { label: "Planned hours", colors: { light: ["var(--metric-plan)"] } },
};
const legend: LegendPart = { type: "legend", id: "legend", align: "center" };

const ctx: CompileContext = {
  chartId,
  config,
  xDataKey: "month",
  data: [
    { month: "Jan", actual: 40, plan: 50 },
    { month: "Feb", actual: 55, plan: 50 },
    { month: "Mar", actual: 62, plan: 60 },
  ],
  // The parts the JSX children would register.
  parts: [
    { type: "grid", id: "grid" },
    { type: "xAxis", id: "x", dataKey: "month" },
    { type: "yAxis", id: "y" },
    { type: "bar", id: "bar", dataKey: "actual" },
    { type: "line", id: "line", dataKey: "plan", variant: "dashed" },
    legend,
  ],
  resolveColor: createColorResolver(chartId, config),
};

// Compile inside the theme: every helper that reads [data-chart=id] in the
// browser reads this theme instead.
const option = withHeadlessTheme(chartId, theme, () =>
  printLegend(ctx, legend, compileComposedOption(ctx)),
);

const svg = renderToSvg(option, { width: 640, height: 300 });
// svg starts with "<svg"; rasterise it (resvg, sharp) or embed it as is.
```

## Rules

| Rule | Why |
|------|-----|
| `ctx.chartId` equals the id you pass to `withHeadlessTheme` | The chart id is the key to the theme |
| Compile **inside** the `withHeadlessTheme` callback | The theme is removed when the callback returns |
| Use concrete colours (hex / rgb) in the theme | No DOM to resolve `oklch()` or `var()` |
| Put `var(--x)` config colours in `theme.tokens` | `createColorResolver` resolves them through the tokens |
| Call `printLegend` when the chart has a `<Legend />` | The browser legend is HTML; an SVG needs an ECharts legend |
| Paint the page background yourself | The option keeps `backgroundColor: "transparent"` |

## The print legend

`printLegend(ctx, legendPart, option)` draws the legend under the plot, in part order:

- a **bar** or an **area** series → a rounded block;
- a **line** series → a short line in the series' own style (dashed and dotted included).

A series with `showInLegend: false` is left out. With no legend part, or `hide: true`, the option comes back unchanged. The grid bottom rises by 28 px (`PRINT_LEGEND_HEIGHT_PX`).

## A donut

```ts
const pieCtx: CompileContext = {
  chartId: "donut-1",
  config: { open: { label: "Open", colors: { light: ["#0ea5e9"] } }, closed: { label: "Closed", colors: { light: ["#22c55e"] } } },
  data: [{ status: "open", value: 12 }, { status: "closed", value: 30 }],
  nameKey: "status",
  parts: [{ type: "pie", id: "pie", dataKey: "value", nameKey: "status", innerRadius: "55%" }, legend],
  resolveColor: createColorResolver("donut-1", { open: { label: "Open", colors: { light: ["#0ea5e9"] } }, closed: { label: "Closed", colors: { light: ["#22c55e"] } } }),
};
const donutSvg = renderToSvg(
  withHeadlessTheme("donut-1", theme, () => printLegend(pieCtx, legend, compilePieOption(pieCtx))),
  { width: 400, height: 300 },
);
```

## What it draws

`renderToSvg` registers the SVG renderer, grid, legend, markLine, markArea, dataZoom and the bar, line, pie and custom families. Pass more ECharts modules with `modules` for another family:

```ts
import { GaugeChart } from "echarts/charts";
renderToSvg(option, { width: 320, height: 200, modules: [GaugeChart] });
```

Animation and the tooltip are off in the render: an image has no frames and no pointer.
