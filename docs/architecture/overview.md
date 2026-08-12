# Architecture overview

Canonical system write-up: **[[architecture/system]]**.  
Layer model (compound · compile · host): **[[architecture/layers]]**.  
Public surface: **[[architecture/public-surface]]**.

NQChart is a **shadcn-style chart registry** — installable React source under `src/registry/`, also published as `@nqlib/nqchart`.

## Stack (top → bottom)

```
src/content/docs/          Fumadocs MDX (public reference)
src/components/            Site UI only (docs chrome, landing)
src/registry/charts/       NQ*Chart compound roots + child parts
src/registry/ui/           Chart shell (ChartContainer, legend, tooltip)
src/registry/echarts-core/ Compilers, hooks, tokens, color resolution
echarts/core               Tree-shaken ECharts modules (echarts-init.ts)
```

## Data flow

1. User composes `<NQBarChart>` + children (`<Bar />`, `<Grid />`, …).
2. Child parts register in `PartRegistryProvider`.
3. `useCompiledOption` builds `CompileContext` from root props + registered parts.
4. `compile-bar.ts` (etc.) returns a pure ECharts `option` object.
5. `EChartsHost` renders via `echarts/core` with SSR-safe color resolution.

## Design principles

See [[product/philosophy]]. Short form:

- **Compound components** — no monolithic `type="bar"` API
- **Primitives + chart-recipes** — BI shapes are data helpers, not duplicate chart modules
- **`chartConfig` keys match `dataKey`**
- **Events, not selection state** — boards own cross-filter state

See [[architecture/dependency-rules]] for import boundaries.
