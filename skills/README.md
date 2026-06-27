# BeeCharts skills

Two audiences — do not mix them.

| Audience | Location | Install |
|----------|----------|---------|
| **Consumers** — apps integrating `@beecharts/*` | [`consumer/beecharts/`](consumer/beecharts/SKILL.md) | `npx skills add ctesibius/beecharts --skill beecharts -y` |
| **Contributors** — this repository | [`.agents/skills/beecharts-dev/`](../.agents/skills/beecharts-dev/SKILL.md), [`.agents/skills/beecharts-docs/`](../.agents/skills/beecharts-docs/SKILL.md) | Already active when working in this repo |

## Two install paths (consumers)

| Goal | Tool | What it copies |
|------|------|----------------|
| Chart React source | **shadcn CLI** — `pnpm dlx shadcn@latest add @beecharts/bar-chart` | `components/beecharts/…`, `lib/chart-recipes.ts` |
| Agent guidance | **skills CLI** — `npx skills add ctesibius/beecharts --skill beecharts -y` | `.agents/skills/beecharts/*.md` only |

Skills do **not** run `shadcn add`. Charts do **not** require the skills CLI. See [/docs/installation](https://beecharts.vercel.app/docs/installation).

## Consumer install (any IDE)

Uses the [Agent Skills](https://agentskills.io) open format:

```bash
npx skills add ctesibius/beecharts --skill beecharts -y
```

HTTP discovery: `/.well-known/agent-skills/beecharts/SKILL.md`

**Source of truth:** edit `skills/consumer/beecharts/`, then run `pnpm sync:skills` (copies to `.agents/skills/beecharts/` and `public/.well-known/agent-skills/beecharts/`).

## Consumer vs development

| | Consumer skill | Development skills |
|--|----------------|-------------------|
| **Who** | Teams building apps with BeeCharts | Maintainers changing engine, registry, docs site |
| **Focus** | Chart type → shadcn install → compose children → BI recipes | Layer boundaries, registry pipeline, MDX previews, DoD |
| **Success** | Chart type chosen, deps installed, chartConfig keys match dataKey, renders light/dark | Roadmap DoD: lint, tsc, test, audit:previews, registry:fresh |
| **Docs** | `skills/consumer/beecharts/` | `.agents/skills/beecharts-dev/`, `.agents/skills/beecharts-docs/`, `docs/` vault |

Consumer skill does **not** cover monorepo architecture or registry internals.  
Development skills do **not** cover how to integrate the library in an external app.
