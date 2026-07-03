# NQChart chart catalog

## Primitives (the only chart modules)

| Slug | Module | Notes |
|------|--------|--------|
| area-chart | `NQAreaChart` | `showBrush`, `brushFormatLabel` |
| line-chart | `NQLineChart` | `showBrush` |
| bar-chart | `NQBarChart` | histogram, bullet, monospace/hover-trace bar variants |
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

## CLI blocks (`registry-blocks.ts`)

| Block | Doc page |
|-------|----------|
| `monospace-bar-chart` | `/docs/bar-chart/blocks` |
| `hover-trace-bar-chart` | `/docs/bar-chart/blocks` |
| `grid-bar-chart` | `/docs/bar-chart/blocks` |
| `isometric-bar-chart` | `/docs/bar-chart/blocks` |

## Example placement (single doc per primitive)

| Block name | Documented on |
|------------|---------------|
| `ex-histogram-chart`, `ex-loading-state-histogram-chart`, `ex-bullet-chart` | bar-chart |
| `ex-pareto-chart`, `ex-loading-state-pareto-chart`, `ex-boxplot-chart` | composed-chart |
| `ex-gauge-chart`, `ex-loading-state-gauge-chart`, `ex-gauge-with-target-chart` | radial-chart |
| `ex-bubble-chart`, `ex-bubble-sized-chart`, `ex-glowing-bubble-chart`, `ex-loading-state-bubble-chart` | scatter-chart |
| `ex-heatmap-chart`, `ex-heatmap-weekly-chart`, `ex-heatmap-correlation-chart`, `ex-heatmap-team-workload-chart` | heatmap-chart |
| `ex-calendar-workload-chart`, `ex-workload-dashboard-chart` | calendar-chart |

## Demo app (not registry blocks)

| Source | Role |
|--------|------|
| `src/components/landing/demo-dashboard.tsx` | Canonical multi-chart SaaS layout |
| `src/components/landing/dashboard-data.ts` | Data + `chartConfigColor` configs |
| Documented in | `skills/consumer/nqchart/demo-dashboard.md` |

## Removed (do not reintroduce)

- Separate registry components: `gauge-chart`, `bullet-chart`, `heatmap-chart` (as BI synonym package), `pareto-chart`, `bubble-chart`, `histogram-chart`
- Separate doc slugs for the above (use primitive + chart-recipes)
- Recharts-era APIs (`isAnimationActive`, `barProps`/`lineProps` as primary escape hatches)
- Duplicate example `.tsx` for the same preview

## Verification

```bash
pnpm run audit:previews      # all ComponentPreview blocks resolve
pnpm run audit:registry-boundary
pnpm exec tsx ./src/scripts/build-registry.mts
```
