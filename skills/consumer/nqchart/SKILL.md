---
name: nqchart
description: >-
  Build dashboards with composable NQChart — install @nqchart/* via shadcn,
  compose NQ*Chart children, theme colors, BI recipes. Use when the user asks
  for charts, graphs, KPIs, sparklines, funnels, waterfalls, heatmaps,
  histograms, pareto, gauges, or @nqchart / NQChart components. NOT for
  contributing to the nqchart repo.
license: MIT
compatibility: Requires React/Next.js, shadcn/ui, echarts, and motion.
metadata:
  author: ctesibius/nqchart
  version: "1.2.0"
---

# NQChart (agent guide)

NQChart is a **composable** chart library (Apache **ECharts** engine): one root (`NQ*Chart`) + shared UI + children you assemble (`<Bar />`, `<Grid />`, `<Tooltip />`, …). It is **not** a single `<Chart type="bar" />` API.

Read in order:

| Doc | Use when |
|-----|----------|
| [when-to-use.md](./when-to-use.md) | Picking chart type from user intent |
| [install.md](./install.md) | CLI packages and peer deps |
| [colors.md](./colors.md) | Theme-aware `ChartConfig` (`chartConfigColor`, gradients) |
| [demo-dashboard.md](./demo-dashboard.md) | Multi-chart SaaS dashboard like the homepage demo |
| [components.md](./components.md) | Roots, parts, and props per chart |
| [recipes.md](./recipes.md) | `@nqchart/chart-recipes` — histogram, bullet, Pareto, heatmap, box plot, gauge |
| [examples.md](./examples.md) | Registry blocks (`ex-*`, CLI blocks) to copy |

Repo docs: `https://nqchart.vercel.app/docs` (or local `/docs/<chart>`).

---

## Success gates

Stop and verify before marking the task done:

| Gate | Check |
|------|-------|
| Chart type | Matches user intent via [when-to-use.md](./when-to-use.md) |
| Install | `shadcn add @nqchart/{chart}` + peers from [install.md](./install.md) |
| Config | `chartConfig` keys match every series `dataKey` / slice `nameKey` |
| Layout | Root has `className="h-full w-full p-4"` (sparklines: `h-12`–`h-16`) |
| Theme | Colors use `chartConfigColor()` or explicit light/dark arrays |
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

1. **Install chart + UI deps** — Every chart needs `@nqchart/chart` at minimum. See [install.md](./install.md).

2. **Compose children** — Root holds `config`, `data`, layout props. Put `<Grid />`, axes, series, `<Tooltip />`, `<Legend />` inside the root.

3. **`chartConfig` drives colors** — Keys must match series `dataKey` / `nameKey`. Use [colors.md](./colors.md) (`chartConfigColor` or explicit light/dark hex).

4. **Size the container** — `className="h-full w-full p-4"` (or fixed `h-64 w-full`) on the root. Sparklines often use `h-12`–`h-16`.

5. **Loading** — `isLoading` on the root; copy `ex-loading-state-*` from [examples.md](./examples.md).

6. **Legend toggle** — `<Legend isClickable />` lets users hide series. Legend manages its own selection state.

7. **Product dashboards** — Follow [demo-dashboard.md](./demo-dashboard.md) for the homepage layout (area + gauge + stacked bar + pie).

---

## Minimal template

```tsx
"use client";

import { NQBarChart, Bar, Grid, XAxis, YAxis, Tooltip, Legend } from "@/components/nqchart/charts/bar-chart";
import { type ChartConfig } from "@/components/nqchart/ui/chart";
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

Adjust import path to match the project (`@/components/nqchart/...` after CLI install).

---

## Shared UI modules

| CLI | Role |
|-----|------|
| `@nqchart/chart` | `ChartContainer`, `ChartConfig`, `LoadingIndicator` |
| `@nqchart/tooltip` | `ChartTooltip` / `ChartTooltipContent` (used by chart `Tooltip`) |
| `@nqchart/legend` | `ChartLegend` / `ChartLegendContent` |
| `@nqchart/dot` | Point markers for line/scatter/radar |
| `@nqchart/background` | `ChartBackground` / `backgroundVariant` on roots |
| `@nqchart/nq-brush` | Zoom brush footer on bar/line/area/composed |

---

## Related skills

- **composition-patterns** — compound components, context, avoid boolean prop sprawl
- **react-best-practices** — performance, lazy dashboards, bundle size
- **nqchart-dev** / **nqchart-docs** — only when modifying the nqchart repository (not for external apps)
