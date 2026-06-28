# BeeCharts — Consumer agent skill

This folder is the **source of truth** for the consumer skill. After edits, run `pnpm sync:skills`.

| Skill | Audience | Use when |
|-------|----------|----------|
| **beecharts** (this folder) | App developers and their coding agents | Choosing charts, installing `@beecharts/*`, composing `Bee*Chart` children, BI recipes |

## Read in order

Start at [SKILL.md](./SKILL.md).

1. [when-to-use.md](./when-to-use.md) — goal → chart type
2. [install.md](./install.md) — CLI packages and peer deps
3. [colors.md](./colors.md) — theme tokens and `ChartConfig`
4. [demo-dashboard.md](./demo-dashboard.md) — homepage SaaS dashboard pattern
5. [components.md](./components.md) — roots and child parts
6. [recipes.md](./recipes.md) — histogram, pareto, gauge, heatmap, calendar
7. [examples.md](./examples.md) — `ex-*` and block names to copy

Docs site: `/docs/chart-recipes` for all BI helpers; primitives under `/docs/<chart>`.

Published agent skill (HTTP): `/.well-known/agent-skills/beecharts/SKILL.md`

## Install in your project

**Charts** (shadcn registry — copies source):

```bash
pnpm dlx shadcn@latest add @beecharts/bar-chart
```

**Agent skill** (markdown guidance only):

```bash
npx skills add ctesibius/beecharts --skill beecharts -y
```

See [install.md](./install.md) for registry namespace setup and peer deps.

- **HTTP:** `/.well-known/agent-skills/beecharts/SKILL.md`
- **Trigger phrases:** BeeCharts, `@beecharts`, gauge, histogram, pareto, waterfall, funnel, composable chart, `BeeBarChart`, demo dashboard, monospace bar, hover trace

## Design principles

- Compound components — no boolean `isGauge` on one mega chart
- Primitives + data recipes — not separate packages per BI synonym
- `chartConfig` keys match `dataKey`
- Size with `className` on the chart root
- Theme colors via `chartConfigColor()` or explicit light/dark arrays — see [colors.md](./colors.md)

**Not for repo maintainers** — use `.agents/skills/beecharts-dev/` and `.agents/skills/beecharts-docs/` instead.

## Working inside the beecharts repository?

If your workspace **is** the beecharts repo, read root [AGENTS.md](../../../AGENTS.md) and [docs/index.md](../../../docs/index.md) — do not use this consumer skill for registry or docs changes.
