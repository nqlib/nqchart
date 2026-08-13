# Component composition reference

Every chart follows the same mental model:

```
<NQ*Chart config data …root props>
  {/* Pick ONE chrome layer — see background-and-grid.md */}
  <Grid />                    // value guides (default analytics)
  {/* OR */}
  <ChartBackground variant="dots" />  // decorative wallpaper

  <XAxis /> <YAxis />         // cartesian
  <Tooltip />                 // always compose for interactive charts
  <Legend />
  <Series />                  // Bar | Line | Area | Scatter | …
</NQ*Chart>
```

Import series and axes from the **same file** as the root (e.g. all from `bar-chart.tsx`).

Wallpaper vs guides: **[background-and-grid.md](./background-and-grid.md)** (required reading before adding a pattern).

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
| `isEmpty` / `emptyState` | Empty plate (default when `data.length === 0`) |
| `error` | Error plate instead of the plot |
| `a11yTable` / `a11yLabel` / `a11ySummary` | Visually hidden data table (default on) |
| `onMarkClick` | Mark click / keyboard Enter → `{ category, seriesKey, datum, value, index, modifiers }` |
| `onBrushChange` | Brush range `{ startIndex, endIndex }` |
| `onChartReady` | Escape hatch — ECharts instance (**unsupported** surface) |
| `chartRef` | `{ getInstance(), toDataURL() }` for PNG export |
| `backgroundVariant` | Legacy root prop — prefer `<ChartBackground variant="…" />` (see below) |
| `showBrush` | Zoom range footer (bar, line, area, composed). Set `false` on KPI blocks. |
| `brushFormatLabel` | Shorten category labels in brush footer |

**Cross-filter example:**

```tsx
<NQBarChart
  config={config}
  data={data}
  xDataKey="month"
  onMarkClick={(e) => {
    // shift/ctrl extend selection on a BI board
    toggleFilter(e.category, { extend: e.modifiers.shift || e.modifiers.ctrl });
  }}
>
  <Grid />
  <XAxis dataKey="month" />
  <YAxis tickFormatter={(v) => `$${v}`} />
  <Bar dataKey="sales" />
  <Tooltip />
  <Legend selected={selectedSeries} onSelectChange={setSelectedSeries} isClickable />
  <ReferenceLine y={budgetCap} label="Budget" tone="warning" />
</NQBarChart>
```

Import `useChartBrush` / `ChartBrushRange` / `ChartHandle` / `NQMarkEvent` from `@nqlib/nqchart`.
`ReferenceLine` / `ReferenceBand` from the same chart subpath as the root.

### Bar-only

| Prop | Values |
|------|--------|
| `layout` | `"vertical"` \| `"horizontal"` |
| `stackType` | `"default"` \| `"stacked"` \| `"percent"` |
| `barRadius` | Default corner radius (px) for all `<Bar />` children |
| `variant` (root) | `"default"` \| `"histogram"` — touching bins, square corners |
| `onHoverTraceChange` | Callback when `<Bar variant="hover-trace" />` focus changes |

**Children:** `Bar`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Bar child:** `dataKey`, `variant`, `radius`, `stackId`, `yAxisId`, `showLabels`, `labelFormatter`

| `Bar` variant | Effect |
|---------------|--------|
| `"default"` | Standard bars |
| `"hatched"` | Diagonal hatch fill |
| `"stripped"` | Striped fill |
| `"monospace"` | Wide → thin intro; expand on hover (see `monospace-bar-chart` block) |
| `"hover-trace"` | Vertical trace line + root `onHoverTraceChange` (see `hover-trace-bar-chart`) |
| `"histogram"` | Used via root `variant="histogram"` + recipe data |

**YAxis:** `yAxisId`, `orientation`, `domain`, `unit`, `tickFormatter`, `scale` (`linear` \| `log` \| `time` \| `category`), `reversed`, `labelRotate`, `labelInterval`

**Legend:** `<Legend isClickable selected onSelectChange />` — uncontrolled by default; pass both for controlled (single-select).

**Annotations:** `<ReferenceLine y={n} />` / `<ReferenceBand y={[lo, hi]} />` (tones: `neutral` \| `accent` \| `positive` \| `warning` \| `critical`).

### Line-only

**Children:** `Line`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Line child:** `dataKey`, `curveType`, stroke variants, `dot`, `lineProps`

### Area-only

**Children:** `Area`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Area child:** `dataKey`, `stackType` on root, `areaVariant`, `curveType`

### Composed

**Children:** `Bar`, `Line`, `Area`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`, `ReferenceLine`, `ReferenceBand`

Bind series to a second axis with flat `yAxisId` (preferred). `barProps` / `lineProps` `{ yAxisId }` still work but are deprecated.

```tsx
<YAxis yAxisId="left" />
<YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
<Bar dataKey="count" yAxisId="left" />
<Line dataKey="cumulative" yAxisId="right" />
<Area dataKey="band" yAxisId="left" />
```

Use **dual Y axes** for Pareto:

```tsx
<YAxis yAxisId="left" />
<YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
<Bar dataKey="count" yAxisId="left" />
<Line dataKey="cumulative" yAxisId="right" />
```

**Cross-filter on composed** (same `onMarkClick` as bar — required for mixed mark boards):

```tsx
<NQComposedChart
  config={config}
  data={data}
  xDataKey="month"
  onMarkClick={(e) => setFilter(String(e.category))}
  onBrushChange={(r) => setBrush(r)}
>
  <Grid />
  <XAxis dataKey="month" />
  <YAxis yAxisId="left" tickFormatter={(v) => `$${v}`} />
  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
  <Tooltip />
  <Legend selected={selected} onSelectChange={setSelected} isClickable />
  <Bar dataKey="planned" yAxisId="left" />
  <Line dataKey="otd" yAxisId="right" />
</NQComposedChart>
```

Import from `@nqlib/nqchart/composed-chart`. See `ex-mark-click-budget-chart` for the bar-only pattern; the event shape is identical on line, area, and composed.

---

## Radial (`NQRadialChart`)

| Prop | Purpose |
|------|---------|
| `nameKey` | Field whose **value** must match a `chartConfig` key (e.g. `series: "score"`) |
| `variant` | `"full"` \| `"semi"` — **semi = gauge/KPI arc** |
| `data` | One row per bar / arc |

**Children:** `RadialBar`, `Tooltip`, `Legend` (optional)

**Gauge pattern:** `variant="semi"`, `{ series: "score", value: 72 }`, `nameKey="series"`, `chartConfig.score`, `<RadialBar dataKey="value" />`. Multi-arc target: `prepareGaugeRows({ score: 72, target: 80 })`.

---

## Pie (`NQPieChart`)

| Prop | Purpose |
|------|---------|
| `nameKey` | Slice label field |
| `data` | Rows with value keys |

**Children:** `Pie`, `Tooltip`, `Legend`

> No `Background` — pie has no x/y axes, so there is no plot area to contain a
> pattern. Background is cartesian-only (see "Chart background" below).

**Pie child:** `dataKey`, `innerRadius` (donut), padding/overlap props

---

## Scatter (`NQScatterChart`)

| Prop | Purpose |
|------|---------|
| `data` | Points with x/y fields |
| `xDataKey` | Often implicit via point shape |

**Children:** `Scatter`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Scatter child:** `dataKey` (series name), `xDataKey`, `yDataKey`, custom `shape` for larger markers (“bubble” look)

---

## Heatmap (`NQHeatmapChart`)

Dedicated grid heatmap — prefer over scatter for intensity matrices.

**Children:** `Heatmap`, `Tooltip`, `Legend`

**Heatmap child:** `dataKey`, `data` (cells from `prepareHeatmapCells`), `xLabels`, `yLabels`, `min`, `max`

**Examples:** `ex-heatmap-chart`, `ex-heatmap-weekly-chart`, `ex-heatmap-correlation-chart`

---

## Calendar (`NQCalendarChart`)

GitHub-style calendar heat for date ranges.

**Children:** `Calendar`, `Tooltip`, `Legend`

**Calendar child:** `dataKey`, `data` (cells from `prepareCalendarWorkloadCells`), `range`, `min`, `max`, `cellSize`, `orient`

**Examples:** `ex-calendar-workload-chart`, `ex-workload-dashboard-chart`

---

## Radar (`NQRadarChart`)

**Children:** `Radar`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `Tooltip`, `Legend`

**Radar child:** `dataKey`, `variant` (`filled` \| `lines`)

---

## Waterfall (`NQWaterfallChart`)

Dedicated module — not composable Bar.

**Children:** `Tooltip`, `Legend`, `Grid`, `XAxis`, `YAxis`

Data rows use waterfall-specific `type` / value fields (see `ex-waterfall-chart`).

---

## Funnel (`NQFunnelChart`)

**Children:** `Stages`, `Tooltip`, `Legend`, `XAxis`, `YAxis`

Stage rows with ordered values (see `ex-funnel-chart`).

- `orient="horizontal"` — native left→right trapezoid funnel
- `sort` — native funnel only; default `"none"` keeps `data` order (use `"descending"` to rank by value)
- `connection="pipe"` — S-curve joins **between levels only** (square outer ends); `turnRadius` optional; defaults horizontal, supports `orient="vertical"`
- Also on `<Stages />`: `connection`, `orient`, `sort`, `taper`, `stageGap`, `turnRadius`

```tsx
<NQFunnelChart data={rows} config={config} connection="pipe">
  <Stages connection="pipe" turnRadius={6} />
  <Tooltip />
</NQFunnelChart>

<NQFunnelChart data={rows} config={config} connection="pipe" orient="vertical">
  <Stages connection="pipe" orient="vertical" turnRadius={6} />
  <Tooltip />
</NQFunnelChart>
```

See `ex-horizontal-funnel-chart`, `ex-pipe-funnel-chart`, `ex-vertical-pipe-funnel-chart`.

---

## Treemap (`NQTreemapChart`)

**Children:** `Tooltip`, `Legend`

Hierarchical `data` on root; see `ex-treemap-chart`.

---

## Sparkline (`NQSparklineChart`)

Minimal chrome — no full axes.

**Children:** `Sparkline`, `Fill`, `ReferenceBand`, `Tooltip`

Small height (`h-12`–`h-16`), `data` with value field.

---

## Chart background (`ChartBackground`)

Full guide: **[background-and-grid.md](./background-and-grid.md)**.

**Opt-in wallpaper, cartesian-only.** No default background — omit the component for a bare chart. `variant` is required (there is no `"none"`).

Compose inside `NQLineChart`, `NQBarChart`, `NQComposedChart`, `NQAreaChart`,
`NQScatterChart` (including bubble), `NQWaterfallChart`, `NQSparklineChart`.
**Not available** on pie, radar, radial, treemap, funnel, or calendar.

```tsx
import { ChartBackground } from "@nqlib/nqchart";

// Wallpaper — omit <Grid />
<ChartBackground variant="dots" />
```

The pattern is clipped to the **plot area between the axes** — it never bleeds under
the axis labels. (Sparkline has no visible axes, so its pattern fills the plot.)

| Variant | Pattern |
|---------|---------|
| `dots` | Dot grid |
| `graph-paper` | Fine square crosshatch (**not** `<Grid />`) |
| `cross-hatch` | Diagonal cross lines |
| `diagonal-lines` | Parallel diagonals |
| `plus`, `bubbles`, `wiggle-lines`, … | See `/docs/ui/background` |

**Do not confuse with `<Grid />`:** that child enables **y-axis split lines** (horizontal guides at value ticks). Background patterns are decorative wallpaper.

**Do not stack them.** If you compose a background, omit `<Grid />`. If you need value guides, omit `ChartBackground`.

---

## Tooltip & Legend variants

**Always compose `<Tooltip />`** on interactive charts (including custom / block charts). Series alone do not provide hover chrome.

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
