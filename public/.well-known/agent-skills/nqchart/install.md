# Install NQChart

NQChart ships as a published npm package: **`@nqlib/nqchart`**. Install it, install its peers, and import charts from per-chart subpaths. No file copying, no shadcn registry setup.

## 1. Install the package

```bash
npm i @nqlib/nqchart
# or: pnpm add @nqlib/nqchart   /   yarn add @nqlib/nqchart
```

## 2. Peer dependencies

Install once per app (the package declares these as peers, not bundled):

```bash
npm i react react-dom echarts motion
```

| Peer | Range |
|------|-------|
| `react` / `react-dom` | `^18.2.0 \|\| ^19.0.0` |
| `echarts` | `^5.6.0` |
| `motion` | `^12.0.0` (motion.dev) |

Most React/Next.js apps already have `react`/`react-dom`; you typically only add `echarts` and `motion`.

## 3. Import per chart family

Each chart family is its own subpath. A family exports its root (`NQ*Chart`) **plus** the scoped children you compose inside it (`Bar`, `XAxis`, `Tooltip`, …):

```tsx
import { NQBarChart, Bar, XAxis, YAxis, Grid, Tooltip, Legend } from "@nqlib/nqchart/bar-chart";
import { type ChartConfig } from "@nqlib/nqchart";
```

Import children from the **same family** as the root — each family defines its own `Bar`/`XAxis`/`Tooltip`, so don't mix a `Bar` from one subpath into another root.

## Subpaths

| Import | Root + notable children |
|--------|-------------------------|
| `@nqlib/nqchart/area-chart` | `NQAreaChart`, `Area`, `Grid`, axes, `Dot`, `Tooltip`, `Legend` |
| `@nqlib/nqchart/bar-chart` | `NQBarChart`, `Bar`, `Grid`, axes, `Tooltip`, `Legend` |
| `@nqlib/nqchart/line-chart` | `NQLineChart`, `Line`, `Grid`, axes, `Dot`, `Tooltip`, `Legend` |
| `@nqlib/nqchart/composed-chart` | `NQComposedChart`, `Bar`, `Line`, `Grid`, axes, `Tooltip`, `Legend` |
| `@nqlib/nqchart/pie-chart` | `NQPieChart`, `Pie`, `Tooltip`, `Legend` |
| `@nqlib/nqchart/radial-chart` | `NQRadialChart`, `RadialBar`, `Tooltip`, `Legend` |
| `@nqlib/nqchart/radar-chart` | `NQRadarChart`, `Radar`, `PolarAngleAxis`, `PolarGrid`, `Dot` |
| `@nqlib/nqchart/scatter-chart` | `NQScatterChart`, `Scatter`, `Dot`, axes, `Tooltip`, `Legend` |
| `@nqlib/nqchart/heatmap-chart` | `NQHeatmapChart`, `Heatmap`, axes, `Tooltip`, `Legend` |
| `@nqlib/nqchart/calendar-chart` | `NQCalendarChart`, `Calendar`, `Tooltip`, `Legend` |
| `@nqlib/nqchart/treemap-chart` | `NQTreemapChart`, `Tiles`, `Tooltip`, `Legend` |
| `@nqlib/nqchart/funnel-chart` | `NQFunnelChart`, `Stages`, axes, `Tooltip`, `Legend` |
| `@nqlib/nqchart/waterfall-chart` | `NQWaterfallChart`, `Bars`, `Grid`, axes, `Tooltip`, `Legend` |
| `@nqlib/nqchart/sparkline-chart` | `NQSparklineChart`, `Sparkline`, `Fill`, `EndDot`, `ReferenceBand` |

There is **no** separate `gauge-chart` / `histogram-chart` subpath — those are patterns on the primitives above (see [recipes.md](./recipes.md)).

## Shared exports — `@nqlib/nqchart` (root)

Types, chart context, and reusable UI primitives that aren't scoped to one family:

```tsx
import {
  type ChartConfig,        // config type used by every chart's `config` prop
  useChart,                // access chart context
  ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
  ChartBackground,         // background variants on roots
  NQBrush, useNQBrush,     // zoom brush footer
  ChartLoadingSkeleton,
} from "@nqlib/nqchart";
```

## BI data helpers — `@nqlib/nqchart/recipes`

Pure data-prep functions (no React) for histogram/Pareto/gauge/box-plot/heatmap/calendar patterns:

```tsx
import { binForHistogram, prepareParetoData, prepareGaugeRows } from "@nqlib/nqchart/recipes";
```

Full list in [recipes.md](./recipes.md).

## Agent skill (Cursor, Claude Code, etc.)

**Does not install any code** — only markdown guidance so agents know which chart to pick and how to compose it:

```bash
# HTTP discovery
https://nqchart.vercel.app/.well-known/agent-skills/nqchart/SKILL.md
```

## Docs

- Per-chart docs: `/docs/bar-chart`, `/docs/line-chart`, … at `https://nqchart.vercel.app/docs`
- Recipes: `/docs/chart-recipes`
- Copy-ready patterns: see [examples.md](./examples.md)
