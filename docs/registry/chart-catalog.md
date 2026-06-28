# Chart catalog

Canonical catalog for registry primitives, examples, and blocks. Full detail also in `.agents/skills/beecharts-dev/chart-catalog.md` (synced from maintainer skill).

## Primitives (the only chart modules)

| Slug | Module | Notes |
|------|--------|--------|
| area-chart | `BeeAreaChart` | `showBrush`, `brushFormatLabel` |
| line-chart | `BeeLineChart` | `showBrush` |
| bar-chart | `BeeBarChart` | histogram, bullet, monospace/hover-trace variants |
| composed-chart | `BeeComposedChart` | pareto + boxplot examples |
| pie-chart | `BeePieChart` | |
| radial-chart | `BeeRadialChart` | semi + gauge examples |
| radar-chart | `BeeRadarChart` | |
| scatter-chart | `BeeScatterChart` | bubble examples |
| heatmap-chart | `BeeHeatmapChart` | grid intensity matrices |
| calendar-chart | `BeeCalendarChart` | date-range calendar heat |
| treemap-chart | `BeeTreemapChart` | |
| waterfall-chart | `BeeWaterfallChart` | Bridge math |
| funnel-chart | `BeeFunnelChart` | Stage layout |
| sparkline-chart | `BeeSparklineChart` | Compact domain |

## Library (`registry:lib`)

| Slug | File | Helpers |
|------|------|---------|
| chart-recipes | `lib/chart-recipes.ts` | `binForHistogram`, `prepareParetoData`, `prepareBulletRow`, `prepareHeatmapCells`, `prepareCalendarWorkloadCells`, `prepareBoxPlotRow`, `normalizeGaugeValue`, `prepareGaugeRows` |

CLI: `@beecharts/chart-recipes` — doc `/docs/chart-recipes`

## Removed (do not reintroduce)

- Separate registry components: `gauge-chart`, `bullet-chart`, `histogram-chart`, `pareto-chart`, `bubble-chart`
- Separate doc slugs for BI synonyms (use primitive + chart-recipes)
- Recharts-era APIs

See [[engine/chart-recipes]] for helper → primitive pairing.
