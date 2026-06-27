# chart-recipes (BI data helpers)

BI shapes are **data helpers + examples**, not separate chart modules.

File: `src/registry/lib/chart-recipes.ts`  
Registry slug: `@beecharts/chart-recipes`  
Public doc: `/docs/chart-recipes`

## Helper → primitive pairing

| Helper | Use with | Example block |
|--------|----------|-----------------|
| `binForHistogram(values, binCount)` | `BeeBarChart` | `ex-histogram-chart` |
| `prepareBulletRow(label, opts)` | `BeeBarChart` horizontal | `ex-bullet-chart` |
| `prepareParetoData(rows, nameKey, valueKey)` | `BeeComposedChart` | `ex-pareto-chart` |
| `prepareBoxPlotRow(category, samples)` | `BeeComposedChart` | `ex-boxplot-chart` |
| `prepareHeatmapCells(rows, cols, matrix)` | `BeeHeatmapChart` | `ex-heatmap-chart` |
| `prepareCalendarWorkloadCells(days)` | `BeeCalendarChart` | `ex-calendar-workload-chart` |
| `normalizeGaugeValue(value, min, max)` | `BeeRadialChart` semi | `ex-gauge-with-target-chart` |
| Semi + one `RadialBar` | `BeeRadialChart` `variant="semi"` | `ex-gauge-chart` |

## Rules

1. Register lib in `registry-lib.ts`; document on `/docs/chart-recipes`.
2. Examples live on the **primitive** doc page, not a separate BI doc slug.
3. Do not add `gauge-chart`, `histogram-chart`, etc. to `meta.json`.

Consumer agents: see `skills/consumer/beecharts/recipes.md`.
