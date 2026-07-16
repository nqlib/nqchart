# Background vs Grid

Two different chrome layers. Pick **one** per chart — never both.

| Layer | What it is | How to add | When to use |
|-------|------------|------------|-------------|
| **`<Grid />`** | Functional **value guides** — horizontal dotted lines at Y ticks | Compose as a child of the chart root | Default for readable cartesian charts |
| **`<ChartBackground />`** | Decorative **wallpaper** clipped to the plot area | Compose `<ChartBackground variant="…" />` | Mood / brand texture behind series |

## Rule (non-negotiable)

```
wallpaper  XOR  Grid
```

- Need tick guides → include `<Grid />`, **no** `ChartBackground`.
- Need a pattern → include `<ChartBackground variant="…" />`, **omit** `<Grid />`.
- Bare chart (no wallpaper, no guides) → omit both.

Stacking them puts a fine wallpaper **and** wide horizontal dotted guides in the same plot — the guides look like a second, inconsistent grid on top of the pattern.

## Supported families

`ChartBackground` works on **cartesian** roots that expose a plot rect:

| Use wallpaper | Do **not** use wallpaper |
|---------------|--------------------------|
| `area`, `line`, `bar`, `composed` | `pie`, `radar`, `radial` |
| `scatter` (incl. bubble variants) | `treemap`, `funnel` |
| `waterfall` | `calendar` (no x/y plot wallpaper) |
| `sparkline` | |

Heatmaps use their own cell chrome — prefer recipe examples over inventing a wallpaper.

**Polar charts** use `<PolarGrid />`, not `<Grid />`. PolarGrid is not interchangeable with cartesian Grid or ChartBackground.

## How to compose

Prefer the **child** API (same pattern as Tooltip / Legend):

```tsx
import { ChartBackground } from "@nqlib/nqchart";
import { NQScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend } from "@nqlib/nqchart/scatter-chart";

// Wallpaper — no <Grid />
<NQScatterChart config={chartConfig} className="h-full w-full p-4">
  <ChartBackground variant="dots" />
  <XAxis dataKey="x" />
  <YAxis dataKey="y" />
  <Tooltip />
  <Legend />
  <Scatter dataKey="desktop" data={points} variant="bubble" />
</NQScatterChart>
```

```tsx
// Value guides — no ChartBackground
<NQBarChart config={chartConfig} data={data} xDataKey="month" className="h-full w-full p-4">
  <Grid />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="desktop" />
</NQBarChart>
```

### Sparkline

Sparklines often use the root prop instead of a child:

```tsx
<NQSparklineChart
  data={data}
  config={config}
  valueDataKey="value"
  backgroundVariant="bubbles"  // wallpaper — do not also add Grid (sparklines have none)
  className="h-12 w-full"
>
  <Fill dataKey="trend" />
  <Sparkline dataKey="trend" />
  <Tooltip />
</NQSparklineChart>
```

On other families, prefer `<ChartBackground />` over the legacy `backgroundVariant` root prop.

## Choosing a variant

| Variant | Look |
|---------|------|
| `dots` | Soft dot lattice |
| `graph-paper` | Fine square mesh (**still not** `<Grid />`) |
| `cross-hatch` / `diagonal-lines` | Line textures |
| `plus`, `bubbles`, `wiggle-lines`, `overlapping-circles`, … | See `/docs/ui/background` |

`variant` is **required** on `ChartBackground` — there is no `"none"`. No background means you simply don’t compose the component.

## Scatter / bubble

Same rules as bar/line: wallpaper **or** `<Grid />`. Bubble charts (`variant="bubble"` / sized markers) still sit in a cartesian plot, so backgrounds apply the same way.

## Watch-outs

1. **Wallpaper + Grid** — omit Grid whenever you add `ChartBackground` (or `backgroundVariant`).
2. **`graph-paper` ≠ Grid** — fine decorative mesh vs wide Y-tick guides.
3. **Always add `<Tooltip />`** on interactive charts (including custom blocks / monospace bars). Hover chrome comes from the composed child, not the series alone.
4. **Don’t cover the plot** — opaque full-bleed series layers (e.g. solid “floor” rectangles behind boxes) can hide Grid guides; keep spacers transparent when Grid is present.
5. **Import children from the same subpath** as the root (`@nqlib/nqchart/scatter-chart` Grid with `NQScatterChart`, not from `bar-chart`).
6. **KPI / marketing blocks** — wallpaper often reads cleaner than Grid; product analytics often prefer Grid. Match the surface.

## Docs

- Live variants: `https://nqchart.vercel.app/docs/ui/background`
- Copy-ready wallpaper examples: `ex-bg-*-line-chart`, `ex-bg-bubbles-sparkline-chart` (see [examples.md](./examples.md))
