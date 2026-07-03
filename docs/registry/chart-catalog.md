# Chart catalog

Canonical catalog for registry primitives, examples, and blocks. Full detail also in `.agents/skills/nqchart-dev/chart-catalog.md` (synced from maintainer skill).

## Primitives (the only chart modules)

| Slug | Module | Notes |
|------|--------|--------|
| area-chart | `NQAreaChart` | `showBrush`, `brushFormatLabel` |
| line-chart | `NQLineChart` | `showBrush` |
| bar-chart | `NQBarChart` | histogram, bullet, monospace/hover-trace variants |
| composed-chart | `NQComposedChart` | pareto + boxplot examples |
| pie-chart | `NQPieChart` | |
| radial-chart | `NQRadialChart` | semi + gauge examples |
| radar-chart | `NQRadarChart` | |
| scatter-chart | `NQScatterChart` | bubble examples |
| heatmap-chart | `NQHeatmapChart` | grid intensity matrices |
| calendar-chart | `NQCalendarChart` | date-range calendar heat |
| treemap-chart | `NQTreemapChart` | |
| waterfall-chart | `NQWaterfallChart` | Bridge math |
| funnel-chart | `NQFunnelChart` | Stage layout |
| sparkline-chart | `NQSparklineChart` | Compact domain |

## Library (`registry:lib`)

| Slug | File | Helpers |
|------|------|---------|
| chart-recipes | `lib/chart-recipes.ts` | `binForHistogram`, `prepareParetoData`, `prepareBulletRow`, `prepareHeatmapCells`, `prepareCalendarWorkloadCells`, `prepareBoxPlotRow`, `normalizeGaugeValue`, `prepareGaugeRows` |

CLI: `@nqchart/chart-recipes` — doc `/docs/chart-recipes`

## Removed (do not reintroduce)

- Separate registry components: `gauge-chart`, `bullet-chart`, `histogram-chart`, `pareto-chart`, `bubble-chart`
- Separate doc slugs for BI synonyms (use primitive + chart-recipes)
- Recharts-era APIs

See [[engine/chart-recipes]] for helper → primitive pairing.
