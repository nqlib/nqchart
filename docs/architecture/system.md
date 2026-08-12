# System architecture

NQChart is a **composable chart library** for React. The product ships two surfaces that
share one source tree:

1. **Installable registry** — `src/registry/` copied into consumer apps via
   `shadcn add @nqchart/<primitive>-chart` (and published as `@nqlib/nqchart` npm packages
   for the same modules).
2. **Docs site** — Next.js + Fumadocs at `/docs`, plus agent HTTP (`/llms.txt`, `/mcp`,
   `/.well-known/agent-skills/`).

Company / consumer context: charts for BI boards (SecoLab Dashboards v2 and similar), not
a general data platform.

```
┌────────────────────────────┐     shadcn add / npm     ┌──────────────────────────┐
│ Consumer app               │ ◀────────────────────── │ @nqlib/nqchart            │
│ NQ*Chart + children        │                         │ src/registry/** (SOT)     │
└────────────┬───────────────┘                         └────────────┬─────────────┘
             │ compose                                               │
             ▼                                                       │
┌────────────────────────────┐                                       │
│ PartRegistry → compile-*   │ ◀─────────────────────────────────────┘
│ → ECharts option           │
│ → EChartsHost (canvas)     │
└────────────────────────────┘

┌────────────────────────────┐
│ Docs site (this repo)      │
│ src/content/docs/  MDX     │
│ src/components/    site UI │  ← never imported by registry
│ src/app/mcp, llms.txt      │
└────────────────────────────┘
```

## Stack (top → bottom)

```
src/content/docs/           Fumadocs MDX — public reference
src/components/             Site-only UI (docs chrome, landing)
src/registry/charts/        NQ*Chart compound roots + child parts
src/registry/ui/            Chart shell (container, legend, tooltip, brush)
src/registry/echarts-core/  Compilers, hooks, tokens, interaction, a11y
echarts/core                Tree-shaken modules (`echarts-init.ts`)
```

## Data flow (one chart mount)

1. Consumer composes `<NQBarChart config data>` + children (`<Bar />`, `<Grid />`, …).
2. Null-render parts register in `PartRegistryProvider` during render.
3. `useCompiledOption` builds `CompileContext` from root props + registered parts.
4. A pure `compile-*.ts` returns an ECharts `option`.
5. `applyChartUiToOption` attaches chrome, tooltip, animation, reference marks.
6. `EChartsHost` / `useNQEcharts` mounts the canvas, binds click/hover, reports plot insets.

Deep dive: [[engine/compile-context]] · layer rules: [[architecture/layers]].

## Public entry points

| Surface | Path / package |
|---------|----------------|
| npm root | `@nqlib/nqchart` → `src/lib/public.ts` |
| Chart families | `@nqlib/nqchart/bar-chart`, `/composed-chart`, … |
| Recipes | `@nqlib/nqchart/recipes` |
| Registry JSON | `public/r/{name}.json` |
| Docs | `/docs/<chart>` |
| Agent markdown | `/llm/*.md`, `/llms.txt` |
| MCP | `/mcp` |
| Agent skills | `/.well-known/agent-skills/nqchart/` |

Contract summary for maintainers: [[architecture/public-surface]] · [[product/specs]].

## What this system is not

- Not a query engine, semantic layer, or dashboard host — consumers own data shaping.
- Not Recharts (migration complete; do not reintroduce).
- Not one mega-component with `type="bar"` — compound roots only.

## Decisions worth knowing

| Decision | Why |
|----------|-----|
| Registry + npm from one tree | Consumers can copy source *or* depend on the package; one SOT |
| Pure compilers | Testable without DOM; SSR-safe option build |
| BI shapes via `chart-recipes` | Avoid `gauge-chart` / `histogram-chart` package sprawl |
| Events, not selection state | Boards already have state libraries; NQChart reports `onMarkClick` |
| Escape hatch `onChartReady` | Documented unsupported surface beats silent forks |

See [[architecture/dependency-rules]] for import boundaries.
