# When to use which chart

Map user language → **one** `Bee*Chart` + optional **chart-recipes** helper.

Install helpers: `npx shadcn@latest add @beecharts/chart-recipes` — see [recipes.md](./recipes.md).

## By analytical goal

| User says | Use | Why |
|-----------|-----|-----|
| Trend, over time, time series | `BeeLineChart` or `BeeAreaChart` | Continuous x (usually time). |
| Compare categories, rankings, volumes | `BeeBarChart` | Discrete labels on one axis. |
| Bars and line metrics together | `BeeComposedChart` | Same x-axis, different geometries. |
| Share of total, composition % | `BeePieChart` | Parts of whole; prefer few slices (<7). |
| Hierarchical breakdown by size | `BeeTreemapChart` | Nested categories as tiles. |
| Two numeric variables, correlation | `BeeScatterChart` | Both axes quantitative. |
| Grid intensity, correlation matrix | `BeeHeatmapChart` | Row × column cells with color scale. |
| Daily/weekly workload by date | `BeeCalendarChart` | Calendar heat (GitHub-style). |
| Multi-attribute profile | `BeeRadarChart` | Same entities across several metrics. |
| Progress, score, capacity, KPI arc | `BeeRadialChart` `variant="semi"` | One or few metrics on an arc. |
| Full circular comparison | `BeeRadialChart` `variant="full"` | Multiple categories as radial bars. |
| Conversion funnel, stage drop-off | `BeeFunnelChart` | Ordered stages, decreasing values. |
| User/path flows between nodes | `BeeSankeyChart` | Source → target flows with weights. |
| Revenue bridge, variance walk | `BeeWaterfallChart` | Bridge stacking semantics. |
| Inline trend in table or card | `BeeSparklineChart` | No axes; tight Y domain. |

## BI terms → primitive + recipe

| BI term | Primitive | Helper / example |
|---------|-----------|------------------|
| Histogram | `BeeBarChart` | `binForHistogram` → `ex-histogram-chart` |
| Bullet | `BeeBarChart` horizontal | `prepareBulletRow` → `ex-bullet-chart` |
| Pareto | `BeeComposedChart` | `prepareParetoData` → `ex-pareto-chart` |
| Box plot | `BeeComposedChart` | `prepareBoxPlotRow` + custom shape → `ex-boxplot-chart` |
| Gauge / speedometer | `BeeRadialChart` semi | `normalizeGaugeValue` → `ex-gauge-chart`, `ex-gauge-with-target-chart` |
| Bubble (x, y, size) | `BeeScatterChart` | `ex-bubble-chart`, `ex-bubble-sized-chart` |
| Heatmap (grid intensity) | `BeeHeatmapChart` | `prepareHeatmapCells` → `ex-heatmap-chart` |
| Calendar heat (by date) | `BeeCalendarChart` | `prepareCalendarWorkloadCells` → `ex-calendar-workload-chart` |
| SaaS revenue dashboard | area + radial + stacked bar + pie | [demo-dashboard.md](./demo-dashboard.md) |

## Line vs area

| Choose | When |
|--------|------|
| `BeeLineChart` | Emphasize the line; brush on long ranges (`showBrush`). |
| `BeeAreaChart` | Emphasize volume; stacked areas for composition over time. |

## Bar layout

| `layout` | When |
|----------|------|
| `"vertical"` (default) | Categories on X, values on Y. |
| `"horizontal"` | Long category labels; bullet charts. |

| `stackType` | When |
|-------------|------|
| `"default"` | Side-by-side series. |
| `"stacked"` | Part-of-whole; bullet range bands. |
| `"percent"` | 100% stacked composition. |

## When **not** to add a new chart file

Different **data shaping**, **props** (`variant`, `layout`), or **ECharts escape hatches** (`barProps`, `scatterProps`) → extend `chart-recipes` + `ex-*` on the primitive doc.

Dedicated modules only for non-standard geometry: waterfall, funnel, sankey, sparkline.

## Specialized charts (keep dedicated module)

`waterfall-chart`, `funnel-chart`, `sankey-chart`, `sparkline-chart`
