# Architecture overview

BeeCharts is a **shadcn-style chart registry** — installable React source under `src/registry/`, not a separate npm chart package.

## Stack (top → bottom)

```
src/content/docs/          Fumadocs MDX (public reference)
src/components/            Site UI only (docs chrome, landing)
src/registry/charts/       Bee*Chart compound roots + child parts
src/registry/ui/           Chart shell (ChartContainer, legend, tooltip)
src/registry/echarts-core/ Compilers, hooks, tokens, color resolution
echarts/core               Tree-shaken ECharts modules (echarts-init.ts)
```

## Data flow

1. User composes `<BeeBarChart>` + children (`<Bar />`, `<Grid />`, …).
2. Child parts register in `PartRegistryProvider`.
3. `useCompiledOption` builds `CompileContext` from root props + registered parts.
4. `compile-bar.ts` (etc.) returns a pure ECharts `option` object.
5. `EChartsHost` renders via `echarts/core` with SSR-safe color resolution.

## Public entry points

| Surface | Path |
|---------|------|
| Registry JSON | `public/r/{name}.json` |
| Docs | `/docs/<chart>` |
| Agent markdown | `/llm/*.md`, `/llms.txt` |
| MCP | `/mcp` (`search_docs`, `read_doc`) |
| Agent skills | `/.well-known/agent-skills/beecharts/` |

## Design principles

- **Compound components** — no monolithic `type="bar"` API
- **Primitives + chart-recipes** — BI shapes are data helpers, not duplicate chart modules
- **`chartConfig` keys match `dataKey`**
- **Theme colors** via `chartConfigColor()` or explicit light/dark arrays

See [[architecture/dependency-rules]] for import boundaries.
