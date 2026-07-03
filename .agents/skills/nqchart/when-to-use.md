# When to use which chart

Map user language → **one** `NQ*Chart` + optional **chart-recipes** helper.

Install helpers: `npx shadcn@latest add @nqchart/chart-recipes` — see [recipes.md](./recipes.md).

## By analytical goal

| User says | Use | Why |
|-----------|-----|-----|
| Trend, over time, time series | `NQLineChart` or `NQAreaChart` | Continuous x (usually time). |
| Compare categories, rankings, volumes | `NQBarChart` | Discrete labels on one axis. |
| Bars and line metrics together | `NQComposedChart` | Same x-axis, different geometries. |
| Share of total, composition % | `NQPieChart` | Parts of whole; prefer few slices (<7). |
| Hierarchical breakdown by size | `NQTreemapChart` | Nested categories as tiles. |
| Two numeric variables, correlation | `NQScatterChart` | Both axes quantitative. |
| Grid intensity, correlation matrix | `NQHeatmapChart` | Row × column cells with color scale. |
| Daily/weekly workload by date | `NQCalendarChart` | Calendar heat (GitHub-style). |
| Multi-attribute profile | `NQRadarChart` | Same entities across several metrics. |
| Progress, score, capacity, KPI arc | `NQRadialChart` `variant="semi"` | One or few metrics on an arc. |
| Full circular comparison | `NQRadialChart` `variant="full"` | Multiple categories as radial bars. |
| Conversion funnel, stage drop-off | `NQFunnelChart` | Ordered stages, decreasing values. |
| Revenue bridge, variance walk | `NQWaterfallChart` | Bridge stacking semantics. |
| Inline trend in table or card | `NQSparklineChart` | No axes; tight Y domain. |

## BI terms → primitive + recipe

| BI term | Primitive | Helper / example |
|---------|-----------|------------------|
| Histogram | `NQBarChart` | `binForHistogram` → `ex-histogram-chart` |
| Bullet | `NQBarChart` horizontal | `prepareBulletRow` → `ex-bullet-chart` |
| Pareto | `NQComposedChart` | `prepareParetoData` → `ex-pareto-chart` |
| Box plot | `NQComposedChart` | `prepareBoxPlotRow` + custom shape → `ex-boxplot-chart` |
| Gauge / speedometer | `NQRadialChart` semi | `normalizeGaugeValue` → `ex-gauge-chart`, `ex-gauge-with-target-chart` |
| Bubble (x, y, size) | `NQScatterChart` | `ex-bubble-chart`, `ex-bubble-sized-chart` |
| Heatmap (grid intensity) | `NQHeatmapChart` | `prepareHeatmapCells` → `ex-heatmap-chart` |
| Calendar heat (by date) | `NQCalendarChart` | `prepareCalendarWorkloadCells` → `ex-calendar-workload-chart` |
| SaaS revenue dashboard | area + radial + stacked bar + pie | [demo-dashboard.md](./demo-dashboard.md) |

## Line vs area

| Choose | When |
|--------|------|
| `NQLineChart` | Emphasize the line; brush on long ranges (`showBrush`). |
| `NQAreaChart` | Emphasize volume; stacked areas for composition over time. |

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

Dedicated modules only for non-standard geometry: waterfall, funnel, sparkline.

## Specialized charts (keep dedicated module)

`waterfall-chart`, `funnel-chart`, `sparkline-chart`
