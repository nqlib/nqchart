# NQChart skills

Two audiences — do not mix them.

| Audience | Location | Install |
|----------|----------|---------|
| **Consumers** — apps integrating `@nqchart/*` | [`consumer/nqchart/`](consumer/nqchart/SKILL.md) | `npx skills add ctesibius/nqchart --skill nqchart -y` |
| **Contributors** — this repository | [`.agents/skills/nqchart-dev/`](../.agents/skills/nqchart-dev/SKILL.md), [`.agents/skills/nqchart-docs/`](../.agents/skills/nqchart-docs/SKILL.md), [`.agents/skills/fixed/`](../.agents/skills/fixed/SKILL.md) | Already active when working in this repo |

## Two install paths (consumers)

| Goal | Tool | What it copies |
|------|------|----------------|
| Chart React source | **shadcn CLI** — `pnpm dlx shadcn@latest add @nqchart/bar-chart` | `components/nqchart/…`, `lib/chart-recipes.ts` |
| Agent guidance | **skills CLI** — `npx skills add ctesibius/nqchart --skill nqchart -y` | `.agents/skills/nqchart/*.md` only |

Skills do **not** run `shadcn add`. Charts do **not** require the skills CLI. See [/docs/installation](https://nqchart.vercel.app/docs/installation).

## Consumer install (any IDE)

Uses the [Agent Skills](https://agentskills.io) open format:

```bash
npx skills add ctesibius/nqchart --skill nqchart -y
```

HTTP discovery: `/.well-known/agent-skills/nqchart/SKILL.md`

**Source of truth:** edit `skills/consumer/nqchart/`, then run `pnpm sync:skills` (copies to `.agents/skills/nqchart/` and `public/.well-known/agent-skills/nqchart/`).

## Consumer vs development

| | Consumer skill | Development skills |
|--|----------------|-------------------|
| **Who** | Teams building apps with NQChart | Maintainers changing engine, registry, docs site |
| **Focus** | Chart type → shadcn install → compose children → BI recipes | Layer boundaries, registry pipeline, MDX previews, DoD |
| **Success** | Chart type chosen, deps installed, chartConfig keys match dataKey, renders light/dark | Roadmap DoD: lint, tsc, test, audit:previews, registry:fresh |
| **Docs** | `skills/consumer/nqchart/` | `.agents/skills/nqchart-dev/`, `.agents/skills/nqchart-docs/`, `.agents/skills/fixed/`, `docs/` vault |

Consumer skill does **not** cover monorepo architecture or registry internals.  
Development skills do **not** cover how to integrate the library in an external app.

## Past fixes (maintainers)

When debugging regressions, search [`.agents/skills/fixed/index.md`](../.agents/skills/fixed/index.md) (domain + semantic index) before inventing a new patch. Add a fix note when you close a non-trivial bug.
