# NQChart — Consumer agent skill

This folder is the **source of truth** for the consumer skill. After edits, run `pnpm sync:skills`.

| Skill | Audience | Use when |
|-------|----------|----------|
| **nqchart** (this folder) | App developers and their coding agents | Choosing charts, installing `@nqlib/nqchart`, composing `NQ*Chart` children, BI recipes |

## Read in order

Start at [SKILL.md](./SKILL.md).

1. [when-to-use.md](./when-to-use.md) — goal → chart type
2. [install.md](./install.md) — `npm i @nqlib/nqchart`, peer deps, subpaths
3. [background-and-grid.md](./background-and-grid.md) — wallpaper **or** Grid, not both
4. [colors.md](./colors.md) — theme tokens and `ChartConfig`
5. [demo-dashboard.md](./demo-dashboard.md) — homepage SaaS dashboard pattern
6. [components.md](./components.md) — roots and child parts
7. [recipes.md](./recipes.md) — histogram, pareto, gauge, heatmap, calendar
8. [examples.md](./examples.md) — `ex-*` and block names to browse in docs

Docs site: `/docs/chart-recipes` for all BI helpers; primitives under `/docs/<chart>`.

Published agent skill (HTTP): `/.well-known/agent-skills/nqchart/SKILL.md`

## Install in your project

**Package** (published npm library):

```bash
npm i @nqlib/nqchart          # + peers: react react-dom echarts motion
```

Import charts per family, e.g. `import { NQBarChart, Bar } from "@nqlib/nqchart/bar-chart"`. See [install.md](./install.md) for subpaths and peer deps.

- **Agent skill** (markdown guidance only, HTTP): `/.well-known/agent-skills/nqchart/SKILL.md`
- **Trigger phrases:** NQChart, `@nqlib/nqchart`, gauge, histogram, pareto, waterfall, funnel, composable chart, `NQBarChart`, demo dashboard, monospace bar, hover trace

## Design principles

- Compound components — no boolean `isGauge` on one mega chart
- Primitives + data recipes — not separate packages per BI synonym
- `chartConfig` keys match `dataKey`
- Size with `className` on the chart root
- Theme colors via `chartConfigColor()` or explicit light/dark arrays — see [colors.md](./colors.md)
- Wallpaper **or** `<Grid />` — never both — see [background-and-grid.md](./background-and-grid.md)
- Always compose `<Tooltip />` on interactive charts

**Not for repo maintainers** — use `.agents/skills/nqchart-dev/` and `.agents/skills/nqchart-docs/` instead.

## Working inside the nqchart repository?

If your workspace **is** the nqchart repo, read root [AGENTS.md](../../../AGENTS.md) and [docs/index.md](../../../docs/index.md) — do not use this consumer skill for registry or docs changes.
