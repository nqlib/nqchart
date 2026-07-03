# chart-recipes (BI data helpers)

BI shapes are **data helpers + examples**, not separate chart modules.

File: `src/registry/lib/chart-recipes.ts`  
Registry slug: `@nqchart/chart-recipes`  
Public doc: `/docs/chart-recipes`

## Helper → primitive pairing

| Helper | Use with | Example block |
|--------|----------|-----------------|
| `binForHistogram(values, binCount)` | `NQBarChart` | `ex-histogram-chart` |
| `prepareBulletRow(label, opts)` | `NQBarChart` horizontal | `ex-bullet-chart` |
| `prepareParetoData(rows, nameKey, valueKey)` | `NQComposedChart` | `ex-pareto-chart` |
| `prepareBoxPlotRow(category, samples)` | `NQComposedChart` | `ex-boxplot-chart` |
| `prepareHeatmapCells(rows, cols, matrix)` | `NQHeatmapChart` | `ex-heatmap-chart` |
| `prepareCalendarWorkloadCells(days)` | `NQCalendarChart` | `ex-calendar-workload-chart` |
| `normalizeGaugeValue(value, min, max)` | `NQRadialChart` semi | `ex-gauge-with-target-chart` |
| Semi + one `RadialBar` | `NQRadialChart` `variant="semi"` | `ex-gauge-chart` |

## Rules

1. Register lib in `registry-lib.ts`; document on `/docs/chart-recipes`.
2. Examples live on the **primitive** doc page, not a separate BI doc slug.
3. Do not add `gauge-chart`, `histogram-chart`, etc. to `meta.json`.

Consumer agents: see `skills/consumer/nqchart/recipes.md`.
