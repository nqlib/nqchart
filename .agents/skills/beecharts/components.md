# Component composition reference

Every chart follows the same mental model:

```
<Bee*Chart config data …root props>
  <Grid />           // cartesian charts
  <XAxis /> <YAxis /> // cartesian
  <Tooltip />
  <Legend />
  <Series />         // Bar | Line | Area | Scatter | …
</Bee*Chart>
```

Import series and axes from the **same file** as the root (e.g. all from `bar-chart.tsx`).

---

## Cartesian charts (bar, line, area, composed)

### Root props (common)

| Prop | Purpose |
|------|---------|
| `config` | `ChartConfig` — colors, labels per `dataKey` |
| `data` | Row array |
| `xDataKey` | Category/time field on X (bar/line/area/composed) |
| `className` | Size — usually `h-full w-full p-4` |
| `isLoading` | Skeleton shimmer |
| `backgroundVariant` | Legacy root prop — prefer `<ChartBackground variant="…" />` (see below) |
| `showBrush` | Zoom range footer (bar, line, area, composed). Set `false` on KPI blocks. |
| `brushFormatLabel` | Shorten category labels in brush footer |

### Bar-only

| Prop | Values |
|------|--------|
| `layout` | `"vertical"` \| `"horizontal"` |
| `stackType` | `"default"` \| `"stacked"` \| `"percent"` |
| `barRadius` | Default corner radius (px) for all `<Bar />` children |
| `variant` (root) | `"default"` \| `"histogram"` — touching bins, square corners |
| `onHoverTraceChange` | Callback when `<Bar variant="hover-trace" />` focus changes |

**Children:** `Bar`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Bar child:** `dataKey`, `variant`, `radius`, `stackId`

| `Bar` variant | Effect |
|---------------|--------|
| `"default"` | Standard bars |
| `"hatched"` | Diagonal hatch fill |
| `"stripped"` | Striped fill |
| `"monospace"` | Wide → thin intro; expand on hover (see `monospace-bar-chart` block) |
| `"hover-trace"` | Vertical trace line + root `onHoverTraceChange` (see `hover-trace-bar-chart`) |
| `"histogram"` | Used via root `variant="histogram"` + recipe data |

**Legend:** `<Legend isClickable />` toggles series visibility (legend owns selection state).

### Line-only

**Children:** `Line`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Line child:** `dataKey`, `curveType`, stroke variants, `dot`, `lineProps`

### Area-only

**Children:** `Area`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Area child:** `dataKey`, `stackType` on root, `areaVariant`, `curveType`

### Composed

**Children:** `Bar`, `Line`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

Use **dual Y axes** for Pareto:

```tsx
<YAxis yAxisId="left" />
<YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
<Bar dataKey="count" barProps={{ yAxisId: "left" }} />
<Line dataKey="cumulative" lineProps={{ yAxisId: "right" }} />
```

---

## Radial (`BeeRadialChart`)

| Prop | Purpose |
|------|---------|
| `nameKey` | Field whose **value** must match a `chartConfig` key (e.g. `series: "score"`) |
| `variant` | `"full"` \| `"semi"` — **semi = gauge/KPI arc** |
| `data` | One row per bar / arc |

**Children:** `RadialBar`, `Tooltip`, `Legend` (optional)

**Gauge pattern:** `variant="semi"`, `{ series: "score", value: 72 }`, `nameKey="series"`, `chartConfig.score`, `<RadialBar dataKey="value" />`. Multi-arc target: `prepareGaugeRows({ score: 72, target: 80 })`.

---

## Pie (`BeePieChart`)

| Prop | Purpose |
|------|---------|
| `nameKey` | Slice label field |
| `data` | Rows with value keys |

**Children:** `Pie`, `Tooltip`, `Legend`, `Background`

**Pie child:** `dataKey`, `innerRadius` (donut), padding/overlap props

---

## Scatter (`BeeScatterChart`)

| Prop | Purpose |
|------|---------|
| `data` | Points with x/y fields |
| `xDataKey` | Often implicit via point shape |

**Children:** `Scatter`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Scatter child:** `dataKey` (series name), `xDataKey`, `yDataKey`, custom `shape` for larger markers (“bubble” look)

---

## Heatmap (`BeeHeatmapChart`)

Dedicated grid heatmap — prefer over scatter for intensity matrices.

**Children:** `Heatmap`, `Tooltip`, `Legend`

**Heatmap child:** `dataKey`, `data` (cells from `prepareHeatmapCells`), `xLabels`, `yLabels`, `min`, `max`

**Examples:** `ex-heatmap-chart`, `ex-heatmap-weekly-chart`, `ex-heatmap-correlation-chart`

---

## Calendar (`BeeCalendarChart`)

GitHub-style calendar heat for date ranges.

**Children:** `Calendar`, `Tooltip`, `Legend`

**Calendar child:** `dataKey`, `data` (cells from `prepareCalendarWorkloadCells`), `range`, `min`, `max`, `cellSize`, `orient`

**Examples:** `ex-calendar-workload-chart`, `ex-workload-dashboard-chart`

---

## Radar (`BeeRadarChart`)

**Children:** `Radar`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `Tooltip`, `Legend`

**Radar child:** `dataKey`, `variant` (`filled` \| `lines`)

---

## Waterfall (`BeeWaterfallChart`)

Dedicated module — not composable Bar.

**Children:** `Tooltip`, `Legend`, `Grid`, `XAxis`, `YAxis`

Data rows use waterfall-specific `type` / value fields (see `ex-waterfall-chart`).

---

## Funnel (`BeeFunnelChart`)

**Children:** `Tooltip`, `Legend`, `Grid`, `XAxis`, `YAxis`

Stage rows with ordered values (see `ex-funnel-chart`).

---

## Treemap (`BeeTreemapChart`)

**Children:** `Tooltip`, `Legend`

Hierarchical `data` on root; see `ex-treemap-chart`.

---

## Sparkline (`BeeSparklineChart`)

Minimal chrome — no full axes.

**Children:** `Sparkline`, `Fill`, `ReferenceBand`, `Tooltip`

Small height (`h-12`–`h-16`), `data` with value field.

---

## Chart background (`ChartBackground`)

Compose inside `BeeLineChart`, `BeeBarChart`, `BeeComposedChart`, `BeeAreaChart`, `BeeSparklineChart`:

```tsx
import { ChartBackground } from "@beecharts/background";

<ChartBackground variant="dots" />
```

| Variant | Pattern |
|---------|---------|
| `dots` | Dot grid |
| `graph-paper` | Fine square crosshatch (**not** `<Grid />`) |
| `cross-hatch` | Diagonal cross lines |
| `diagonal-lines` | Parallel diagonals |
| `plus`, `bubbles`, `wiggle-lines`, … | See `/docs/ui/background` |

**Do not confuse with `<Grid />`:** that child enables **y-axis split lines** (horizontal guides at value ticks, wide spacing). Background `graph-paper` is a **decorative wallpaper** behind the series.

---

## Tooltip & Legend variants

Install or copy from examples:

- Tooltip: `ex-tooltip-default-bar-chart`, `ex-tooltip-frosted-glass-bar-chart`
- Legend: `ex-legend-square-line-chart`, `ex-legend-vertical-bar-line-chart`, etc.

Pass `variant` and `roundness` on `<Tooltip />` / `<Legend />` where supported.

---

## Hooks

| Hook | Chart | Use |
|------|-------|-----|
| `useLoadingData` | bar, line, area, composed, scatter, radar | Custom loading row counts |

Prefer root `isLoading` when the built-in skeleton is enough.
