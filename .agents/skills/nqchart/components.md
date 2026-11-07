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
| `hoverFocus` | Hover dim (default on). `false` keeps tooltip, skips sibling fade. Sparkline/gauge stay tooltip-only. |
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
`ReferenceLine` / `ReferenceBand` / `RangeArea` from the same chart subpath as the root.

### Bar-only

| Prop | Values |
|------|--------|
| `layout` | `"vertical"` \| `"horizontal"` |
| `stackType` | `"default"` \| `"stacked"` \| `"percent"` |
| `barRadius` | Default corner radius (px) for all `<Bar />` children; omit to follow `--radius-sm` (3px). The zero-line end stays square |
| `variant` (root) | `"default"` \| `"histogram"` — touching bins, square corners |
| `onHoverTraceChange` | Callback when `<Bar variant="hover-trace" />` focus changes |

**Children:** `Bar`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Bar child:** `dataKey`, `variant`, `radius`, `stackId`, `yAxisId`, `showLabels`, `labelFormatter`

**Signature look (every bar):** 28% gap between categories, 8% between bars of a category (histogram: none). Stacked segments get a 2px seam (`--chart-gap`) and round their outer end plus the corners facing a seam; the zero-line end stays square. Same rules in composed and waterfall.

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

**Annotations:** `<ReferenceLine y={n} />` / `<ReferenceBand y={[lo, hi]} />` / `<RangeArea lowKey highKey />` (tones: `neutral` \| `accent` \| `positive` \| `warning` \| `critical`). `ReferenceBand` `y` may be `[number | null, number | null]` — `null` is the axis edge. `includeInDomain` (default `true`) extends an automatic axis; a caller-set `min` or `max` is left alone. Each `yAxisId` gets its own silent series. `RangeArea` fills `highKey - lowKey`, skips a row when either value is null, and stays out of the legend and tooltip.

### Line-only

**Children:** `Line`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`, `ReferenceLine`, `ReferenceBand`, `RangeArea`

**Line child:** `dataKey`, `curveType`, `variant` (`solid` \| `dashed` \| `dotted`; composed also `points` for markers-only), `dot`, `lineProps`

### Area-only

**Children:** `Area`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`

**Area child:** `dataKey`, `stackType` on root, `areaVariant`, `curveType`

### Composed

**Children:** `Bar`, `Line`, `Area`, `XAxis`, `YAxis`, `Grid`, `Tooltip`, `Legend`, `ReferenceLine`, `ReferenceBand`, `RangeArea`

`<Area dataKey="otd" />` + `<Line dataKey="otd" />` is a fill-under-line: one legend row, `onMarkClick.seriesKey` is still `"otd"`.

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

**Gauge / radial look:** round-capped arcs; ring/petal corners 3px (`cornerRadius`).

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

**Pie child:** `dataKey`, `nameKey`, `innerRadius` (donut), `outerRadius` (px or `"NN%"`), `showLabels`, `sort` (`"descending" | "ascending" | "none"`)

**Signature look (every pie):** even 2px seam between slices (`gap`, from `--chart-gap`) and 11px rounded corners (`cornerRadius`); labels sit outside on two-leg leader lines that never overlap (slices under 3° skip theirs). `gap={0} cornerRadius={0}` restores touching wedges.

**Rose:** `<Pie rose="radius" />` — slice angle and length both follow the value (`rose="area"`: equal angles, length only). Largest first, clockwise from 12 o'clock, fitted to the card. Labels off by default. Not the same as the radial chart's `radialLayout="rose"` (equal-angle polar petals).

```tsx
<NQPieChart data={rows} nameKey="channel" config={config}>
  <Legend />
  <Tooltip />
  <Pie dataKey="visits" nameKey="channel" rose="radius" />
</NQPieChart>
```

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

Cells use the signature: `radius.mark` corners and a `gap.seam` seam (a canvas-colour border — the one painted-seam exception, since ECharts heatmaps have no geometric gap). Not configurable per chart; theme via `--radius` / `--chart-gap`.

**Examples:** `ex-heatmap-chart`, `ex-heatmap-weekly-chart`, `ex-heatmap-correlation-chart`

---

## Calendar (`NQCalendarChart`)

GitHub-style calendar heat for date ranges.

**Children:** `Calendar`, `Tooltip`, `Legend`

**Calendar child:** `dataKey`, `data` (cells from `prepareCalendarWorkloadCells`), `range`, `min`, `max`, `cellSize`, `orient`

Day cells use the same signature as heatmap: `radius.mark` corners and a `gap.seam` seam.

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

**Root:** `barRadius` (px; default `--radius-sm`). Start / total columns keep the zero line square; floating steps round both ends. Same 28% / 8% gaps as bars.

---

## Funnel (`NQFunnelChart`)

**Children:** `Stages`, `Tooltip`, `Legend`, `XAxis`, `YAxis`

Stage rows with ordered values (see `ex-funnel-chart`).

- `orient="horizontal"` — native left→right trapezoid funnel
- `sort` — native / rounded; default `"none"` keeps `data` order (use `"descending"` to rank by value)
- `connection="pipe"` — S-curve joins **between levels only** (square outer ends); `turnRadius` optional; defaults horizontal, supports `orient="vertical"`
- `connection="rounded"` — curved trapezoid (continuous taper, rim curves, gaps); true fillet corners: `cornerRadius` (px, default 11) on the funnel's outer corners only (top of first stage, bottom of last), `innerCornerRadius` (px, default 3, clamped to `cornerRadius`) on every corner facing a gap so the silhouette flows between layers; rim curvature `rimDepth` (fraction of edge width, default 0.03, 0 = flat); optional inward wall bow `sideCurve` (0–1); gaps via `stageGap` (default 8, shared by `segmented`, `rounded`, `cone`; `segmented` is a real gap, no painted border)
- `connection="cone"` — 3D cone slices: elliptical rims (`coneTilt` = rim height / width, default 0.18, max 0.5), walls tangent to both rims, shaded fronts; `coneStyle="hollow"` (default, dark opening on the first stage) or `"solid"` (lit top faces); vertical only; gaps via `stageGap` (default 8)
- Also on `<Stages />`: `connection`, `orient`, `sort`, `taper`, `stageGap`, `turnRadius`, `cornerRadius`, `sideCurve`, `rimDepth`, `innerCornerRadius`, `coneTilt`, `coneStyle`

```tsx
<NQFunnelChart data={rows} config={config} connection="pipe">
  <Stages connection="pipe" turnRadius={6} />
  <Tooltip />
</NQFunnelChart>

<NQFunnelChart data={rows} config={config} connection="pipe" orient="vertical">
  <Stages connection="pipe" orient="vertical" turnRadius={6} />
  <Tooltip />
</NQFunnelChart>

<NQFunnelChart data={rows} config={config} connection="rounded" cornerRadius={11} stageGap={8}>
  <Stages connection="rounded" cornerRadius={11} stageGap={8} />
  <Tooltip />
</NQFunnelChart>
```

See `ex-horizontal-funnel-chart`, `ex-pipe-funnel-chart`, `ex-vertical-pipe-funnel-chart`.

---

## Sankey (`NQSankeyChart`)

**Children:** `Tooltip`

Flows from source to outcome. `data` = one row per **link** (`sourceKey` / `targetKey` / `valueKey`, defaults `"source"` / `"target"` / `"value"`); nodes are derived from the links unless you pass `nodes`. `config` is keyed by **node name** (colour + display label); nodes without an entry take the `--chart-1…5` palette. See `ex-sankey-chart`.

- Root props: `orient` (`"horizontal"` default | `"vertical"`), `nodeAlign` (`"justify"` default | `"left"` | `"right"`), `nodeWidth` (px, default 12), `nodeGap` (px, default 8 = signature stage gap), `showLabels` (default true — name + throughput), `linkColor` (`"source"` default | `"gradient"`), `formatValue`, `hoverFocus`, `onMarkClick`, loading / empty / error, a11y table
- Node throughput = `max(inflow, outflow)`; tooltip: node → throughput, link → `Source → Target: value`
- Hover a node → it + its links stay; hover a link → it + its two nodes; the rest dims (`hoverFocus={false}` to opt out)
- Links must form a DAG: cycles, self-loops, empty ends and values ≤ 0 are dropped (dev warning)
- Node keys become CSS variables — use slug names (`"paidAds"`) and put display text in `config[key].label`

```tsx
<NQSankeyChart data={flows} valueKey="visitors" config={config} formatValue={(v) => compact.format(v)}>
  <Tooltip />
</NQSankeyChart>
```

---

## Treemap (`NQTreemapChart`)

**Children:** `Tooltip`, `Legend`

Hierarchical `data` on root; see `ex-treemap-chart`. Tiles are separated by real space (`gap.seam`, same at every level — no painted border) with `radius.mark` corners; theme via `--chart-gap` / `--radius`.

---

## Sparkline (`NQSparklineChart`)

Minimal chrome — no full axes.

**Children:** `Sparkline`, `Fill`, `ReferenceBand`, `Tooltip`

Small height (`h-12`–`h-16`), `data` with value field.

---

## KPI card (`NQKpiCard`)

Not a compound root — one component. `@nqchart/kpi-card` (pulls in `sparkline-chart`).

**Props:** `label`, `value`, `formatValue?`, `previousValue?` → delta, `delta?` (override; percent is a fraction), `deltaFormat?: "percent" | "absolute"` (default percent), `higherIsBetter?` (default `true`; `false` for churn/cost), `comparisonLabel?`, `target?` (progress track), `sparkline?: number[]` or `data` + `dataKey`, `color?` (default `var(--chart-1)`), `isLoading?`, `isEmpty?`, `className?`.

Percent delta = `(value − previous) / |previous|`; from `0` it falls back to absolute. Rounds to 0.0% → flat (muted). Lay cards out with `grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]`. See `ex-kpi-card`.

---

## Small multiples (`NQSmallMultiples`)

One chart per facet, shared y-domain, one legend. `@nqchart/small-multiples` + the chart you render.

**Children:** render prop `(rows, facet) => ReactNode`; pin the axis with `<YAxis domain={facet.domain} />`.

**Props:** `data`, `facetKey`, `sharedYDomain?` (default `true`), `valueKeys?`, `includeZero?` (default `true`), `columns?` (max; wraps below `minFacetWidth`, default 220), `facetHeight?` (default 160), `facetLabel?`, `config?` + `legend?: boolean | string[]` (omit `<Legend />` inside facets), `gap?`. See `ex-small-multiples-chart`.

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
