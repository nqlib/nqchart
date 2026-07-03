# Registry examples index

All previews are registered in `src/registry/registry-example.ts`, `registry-doc-examples.ts`, `registry-ui-examples.ts`, and `registry-blocks.ts`. Source files live under `src/registry/examples/` and `src/registry/blocks/`.

**Discover everything:** `pnpm run audit:previews` (repo) — should report all blocks OK.

**Embed in docs:** `<ComponentPreview name="ex-bar-chart" />` or `name="monospace-bar-chart"`.

---

## Agent workflow

1. [when-to-use.md](./when-to-use.md) → pick primitive
2. [install.md](./install.md) → CLI packages
3. [colors.md](./colors.md) → theme-aware `ChartConfig`
4. Closest `ex-*` or block below → copy composition
5. [components.md](./components.md) → child parts
6. [recipes.md](./recipes.md) → data helpers
7. Product dashboard layout → [demo-dashboard.md](./demo-dashboard.md)

---

## CLI blocks (copy whole file)

Install with `npx shadcn@latest add @nqchart/<block-name>`.

| Block name | File | Chart |
|------------|------|-------|
| `monospace-bar-chart` | `blocks/b-monospace-bar-chart.tsx` | Bar + KPI chrome, `<Bar variant="monospace" />` |
| `hover-trace-bar-chart` | `blocks/b-hover-trace-bar-chart.tsx` | Bar + trace KPI, `<Bar variant="hover-trace" />` |
| `grid-bar-chart` | `blocks/b-grid-bar-chart.tsx` | Stacked ghost grid bars |
| `isometric-bar-chart` | `blocks/b-isometric-bar-chart.tsx` | Rounded isometric bars |

Docs: `/docs/bar-chart/blocks`

---

## Core examples (`registry-example.ts`)

Dedicated `.tsx` files — best starting points for primitives.

### Bar

| Block | Notes |
|-------|-------|
| `ex-bar-chart` | Default vertical, dual series |
| `ex-loading-state-bar-chart` | Skeleton |
| `ex-stacked-type-bar-chart` | `stackType="stacked"` |
| `ex-percent-type-bar-chart` | `stackType="percent"` |
| `ex-horizontal-layout-bar-chart` | `layout="horizontal"` |
| `ex-hatched-variant-bar-chart` | `<Bar variant="hatched" />` |
| `ex-stripped-variant-bar-chart` | `<Bar variant="stripped" />` |
| `ex-histogram-chart` | `binForHistogram` recipe |
| `ex-loading-state-histogram-chart` | Histogram skeleton |
| `ex-bullet-chart` | `prepareBulletRow` recipe |

### Line & area

| Block | Notes |
|-------|-------|
| `ex-line-chart` | Default |
| `ex-loading-state-line-chart` | Skeleton |

*(Area variants live in doc examples below.)*

### Composed

| Block | Notes |
|-------|-------|
| `ex-composed-chart` | Bar + line |
| `ex-loading-state-composed-chart` | Skeleton |
| `ex-pareto-chart` | `prepareParetoData` |
| `ex-loading-state-pareto-chart` | Pareto skeleton |
| `ex-boxplot-chart` | `prepareBoxPlotRow` |

### Pie, radial, heatmap, calendar

| Block | Notes |
|-------|-------|
| `ex-pie-chart` | Donut-ready |
| `ex-gauge-chart` | Radial semi gauge |
| `ex-gauge-with-target-chart` | Score + target arcs |
| `ex-heatmap-chart` | `NQHeatmapChart` + `prepareHeatmapCells` |
| `ex-heatmap-weekly-chart` | Week grid heatmap |
| `ex-heatmap-correlation-chart` | Correlation matrix |
| `ex-heatmap-team-workload-chart` | Team workload grid |
| `ex-calendar-workload-chart` | `NQCalendarChart` |
| `ex-workload-dashboard-chart` | Calendar + heatmap combo |

---

## Doc examples (`ex-doc-charts.tsx`)

67 exports in one file — variants, loading states, and full primitive coverage. Grouped by chart:

| Primitive | Example blocks (sample) |
|-----------|-------------------------|
| **area** | `ex-area-chart`, `ex-stacked-type-area-chart`, `ex-gradient-area-variant-area-chart`, `ex-loading-state-area-chart`, … |
| **bar** | `ex-chart-config-default-bar-chart`, `ex-gradient-colors-bar-chart`, … |
| **composed** | *(use core `ex-composed-chart`)* |
| **radar** | `ex-radar-chart`, `ex-circle-grid-radar-chart`, `ex-glowing-radar-chart`, `ex-loading-state-radar-chart`, … |
| **radial** | `ex-radial-chart`, `ex-semi-variant-radial-chart`, `ex-rose-radial-chart`, `ex-glowing-radial-chart`, `ex-loading-state-radial-chart`, … |
| **pie** | *(use core `ex-pie-chart`)* |
| **scatter** | `ex-scatter-chart`, `ex-bubble-chart`, `ex-bubble-sized-chart`, `ex-glowing-bubble-chart`, `ex-loading-state-scatter-chart`, … |
| **treemap** | `ex-treemap-chart`, `ex-glowing-treemap-chart`, `ex-loading-state-treemap-chart` |
| **funnel** | `ex-funnel-chart`, `ex-glowing-funnel-chart`, `ex-loading-state-funnel-chart` |
| **waterfall** | `ex-waterfall-chart`, `ex-glowing-waterfall-chart`, `ex-loading-state-waterfall-chart` |
| **sparkline** | `ex-sparkline-chart`, `ex-sparkline-area-chart`, `ex-sparkline-end-dot-chart`, `ex-sparkline-reference-band-chart`, `ex-bg-bubbles-sparkline-chart`, … |

Full list: `src/registry/registry-doc-examples.ts`.

---

## UI examples (`ex-ui-charts.tsx`)

Backgrounds, legends, tooltips — usually paired with line or bar:

| Category | Blocks |
|----------|--------|
| **Backgrounds** | `ex-bg-dots-line-chart`, `ex-bg-graph-paper-line-chart`, `ex-bg-cross-hatch-line-chart`, `ex-bg-diagonal-lines-line-chart`, `ex-bg-plus-line-chart`, `ex-bg-bubbles-line-chart`, … |
| **Legend** | `ex-legend-square-line-chart`, `ex-legend-circle-line-chart`, `ex-legend-vertical-bar-line-chart`, `ex-legend-horizontal-bar-line-chart`, … |
| **Tooltip** | `ex-tooltip-default-bar-chart`, `ex-tooltip-frosted-glass-bar-chart` |

---

## Shared datasets

| File | Use |
|------|-----|
| `example-shared.ts` | Traffic `desktop`/`mobile` — bar, line, composed basics |
| `example-datasets.ts` | Extended BI datasets |
| `chart-tokens.ts` | `chartConfigColor()` for theme palette |
| `dashboard-data.ts` (landing) | SaaS demo — see [demo-dashboard.md](./demo-dashboard.md) |

---

## Loading state naming

Pattern: `ex-loading-state-<primitive>-chart` or `ex-loading-state-<feature>-chart`.

Set `isLoading` on the chart root; match skeleton density with the loading example for that primitive.
