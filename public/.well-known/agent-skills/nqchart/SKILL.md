---
name: nqchart
description: >-
  Build dashboards with composable NQChart — install the @nqlib/nqchart npm
  package, compose NQ*Chart children, theme colors, BI recipes. Use when the
  user asks for charts, graphs, KPIs, sparklines, funnels, waterfalls,
  heatmaps, histograms, pareto, gauges, or @nqlib/nqchart / NQChart components.
  NOT for contributing to the nqchart repo.
license: MIT
compatibility: Requires React, echarts, and motion (peer deps).
metadata:
  author: ctesibius/nqchart
  version: "1.3.0"
---

# NQChart (agent guide)

NQChart is a **composable** chart library (Apache **ECharts** engine): one root (`NQ*Chart`) + shared UI + children you assemble (`<Bar />`, `<Grid />`, `<Tooltip />`, …). It is **not** a single `<Chart type="bar" />` API.

Read in order:

| Doc | Use when |
|-----|----------|
| [when-to-use.md](./when-to-use.md) | Picking chart type from user intent |
| [install.md](./install.md) | `npm i @nqlib/nqchart`, peer deps, subpaths |
| [background-and-grid.md](./background-and-grid.md) | Wallpaper vs value guides — **pick one** |
| [colors.md](./colors.md) | Theme-aware `ChartConfig` (`chartConfigColor`, gradients) |
| [demo-dashboard.md](./demo-dashboard.md) | Multi-chart SaaS dashboard like the homepage demo |
| [components.md](./components.md) | Roots, parts, and props per chart |
| [recipes.md](./recipes.md) | `@nqlib/nqchart/recipes` — histogram, bullet, Pareto, heatmap, box plot, gauge |
| [examples.md](./examples.md) | Copy-ready chart patterns |

Repo docs: `https://nqchart.vercel.app/docs` (or local `/docs/<chart>`).

---

## Success gates

Stop and verify before marking the task done:

| Gate | Check |
|------|-------|
| Chart type | Matches user intent via [when-to-use.md](./when-to-use.md) |
| Install | `npm i @nqlib/nqchart` + peers from [install.md](./install.md) |
| Config | `chartConfig` keys match every series `dataKey` / slice `nameKey` |
| Layout | Root has `className="h-full w-full p-4"` (sparklines: `h-12`–`h-16`) |
| Theme | Colors use `chartConfigColor()` or explicit light/dark arrays |
| Chrome | Wallpaper **or** `<Grid />` — never both ([background-and-grid.md](./background-and-grid.md)) |
| Hover | Interactive charts include a composed `<Tooltip />` |
| Render | Chart renders in light and dark mode |

---

## Quick decision tree

```
User goal?
├─ Trend over time → line-chart or area-chart
├─ Compare categories → bar-chart
├─ Bars + line together → composed-chart
├─ Part-to-whole → pie-chart or treemap-chart
├─ Single KPI / progress arc → radial-chart (variant="semi")
├─ Compare metrics on axes → radar-chart
├─ X vs Y correlation → scatter-chart
├─ Grid intensity / correlation → heatmap-chart
├─ Calendar heat (GitHub-style) → calendar-chart
├─ Flow / funnel stages → funnel-chart
├─ Bridge / running total deltas → waterfall-chart
├─ Inline tiny trend (table/KPI) → sparkline-chart
├─ Distribution of numbers → bar-chart + binForHistogram (recipes.md)
├─ 80/20 / cumulative % → composed-chart + prepareParetoData (recipes.md)
├─ Terminal-style KPI bars → bar-chart blocks (monospace-bar-chart)
└─ Hierarchy by area → treemap-chart
```

**Do not** install separate `gauge-chart`, `histogram-chart`, etc. Those are **patterns** on primitives (see [recipes.md](./recipes.md)).

---

## Non-negotiable patterns

1. **Install the package + peers** — `npm i @nqlib/nqchart` plus `react react-dom echarts motion`. See [install.md](./install.md).

2. **Compose children** — Root holds `config`, `data`, layout props. Put axes, series, `<Tooltip />`, `<Legend />` inside the root. Add `<Grid />` **or** `<ChartBackground />`, not both.

3. **`chartConfig` drives colors** — Keys must match series `dataKey` / `nameKey`. Use [colors.md](./colors.md) (`chartConfigColor` or explicit light/dark hex).

4. **Size the container** — `className="h-full w-full p-4"` (or fixed `h-64 w-full`) on the root. Sparklines often use `h-12`–`h-16`.

5. **Wallpaper XOR Grid** — Decorative patterns via `<ChartBackground variant="…" />` (scatter/bubble included). Value guides via `<Grid />`. Never stack them — see [background-and-grid.md](./background-and-grid.md).

6. **Always compose `<Tooltip />`** for interactive charts (including custom blocks). Hover UI does not appear from series alone.

7. **Loading** — `isLoading` on the root; copy `ex-loading-state-*` from [examples.md](./examples.md).

8. **Legend toggle** — `<Legend isClickable />` lets users hide series. Legend manages its own selection state.

9. **Product dashboards** — Follow [demo-dashboard.md](./demo-dashboard.md) for the homepage layout (area + gauge + stacked bar + pie).

---

## Minimal template

```tsx
"use client";

import { NQBarChart, Bar, Grid, XAxis, YAxis, Tooltip, Legend } from "@nqlib/nqchart/bar-chart";
import { type ChartConfig } from "@nqlib/nqchart";
import { chartConfigColor } from "@/lib/chart-tokens"; // copy from colors.md

const data = [{ month: "Jan", desktop: 120, mobile: 80 }];

const chartConfig = {
  desktop: { label: "Desktop", colors: chartConfigColor(1) },
  mobile: { label: "Mobile", colors: chartConfigColor(4) },
} satisfies ChartConfig;

export function RevenueChart() {
  return (
    <NQBarChart config={chartConfig} data={data} xDataKey="month" className="h-full w-full p-4">
      <Grid />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="desktop" />
      <Bar dataKey="mobile" />
    </NQBarChart>
  );
}
```

Import the root from `@nqlib/nqchart/{family}` and its children from the **same** subpath.

---

## Shared exports

All from the root `@nqlib/nqchart` (no separate install — one package):

| Import | Role |
|--------|------|
| `ChartConfig`, `useChart` | Config type + chart context |
| `ChartTooltip`, `ChartTooltipContent` | Backing the per-chart `Tooltip` child |
| `ChartLegend`, `ChartLegendContent` | Backing the per-chart `Legend` child |
| `ChartBackground` | Plot wallpaper — use **instead of** `<Grid />` ([background-and-grid.md](./background-and-grid.md)) |
| `NQBrush`, `useNQBrush` | Zoom brush footer on bar/line/area/composed |
| `ChartLoadingSkeleton` | Loading placeholder |

BI data helpers live at `@nqlib/nqchart/recipes` — see [recipes.md](./recipes.md).

---

## Related skills

- **composition-patterns** — compound components, context, avoid boolean prop sprawl
- **react-best-practices** — performance, lazy dashboards, bundle size
- **nqchart-dev** / **nqchart-docs** — only when modifying the nqchart repository (not for external apps)
