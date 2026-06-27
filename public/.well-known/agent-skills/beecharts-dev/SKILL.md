---
name: beecharts-dev
description: >-
  Contribute to the BeeCharts repository — engine, registry, examples,
  chart-recipes, and compilers. Use when adding charts, registry items, or
  examples in beecharts. Covers primitives only, no duplicate BI chart modules.
  NOT for integrating @beecharts/* in external consumer apps.
metadata:
  author: beecharts
  version: "1.0.0"
---

# BeeCharts — development skill (engine + registry)

> Docs site work: see [beecharts-docs](../beecharts-docs/SKILL.md).  
> Consumer integration: see [skills/consumer/beecharts](../../../skills/consumer/beecharts/SKILL.md).

This skill is for **maintainers** of the beecharts repository only.

Read **[chart-catalog.md](./chart-catalog.md)** for the chart list and example index.  
Internal vault: [docs/index.md](../../../docs/index.md).  
DoD: [docs/product/ai-contract.md](../../../docs/product/ai-contract.md).

## In / out of scope

| In scope | Out of scope |
|----------|--------------|
| `src/registry/**`, compilers, chart-recipes | External app integration workflow |
| Registry examples (`ex-*`), blocks | MDX pages, landing (→ beecharts-docs) |
| Vitest compiler tests | Consumer skill prose (→ edit SOT + sync) |

## Rules

1. **One primitive per chart family** — bar, line, area, composed, scatter, radial, pie, radar, sankey, treemap, waterfall, funnel, sparkline, heatmap, calendar.
2. **BI shapes = data helpers + examples** — use `src/registry/lib/chart-recipes.ts`, not new chart components.
3. **Examples live on the primitive doc** — register in `registry-example.ts`; embed with `<ComponentPreview name="ex-…" />` in matching `static.mdx`.
4. **No duplicate doc nav** — do not add `gauge-chart`, `histogram-chart`, etc. to `meta.json`.
5. **Registry boundary** — `src/registry/**` must not import `src/components/**`. Run `pnpm run audit:registry-boundary`.
6. **ECharts engine** — compilers are pure fns in `compile-*.ts` + `useCompiledOption`. No Recharts.

## chart-recipes

| Helper | Use with | Example block |
|--------|----------|---------------|
| `binForHistogram(values, binCount)` | `BeeBarChart` | `ex-histogram-chart` |
| `prepareBulletRow(label, opts)` | `BeeBarChart` horizontal | `ex-bullet-chart` |
| `prepareParetoData(rows, nameKey, valueKey)` | `BeeComposedChart` | `ex-pareto-chart` |
| `prepareBoxPlotRow(category, samples)` | `BeeComposedChart` | `ex-boxplot-chart` |
| `prepareHeatmapCells(rows, cols, matrix)` | `BeeHeatmapChart` | `ex-heatmap-chart` |
| `prepareCalendarWorkloadCells(days)` | `BeeCalendarChart` | `ex-calendar-workload-chart` |
| `normalizeGaugeValue(value, min, max)` | `BeeRadialChart` semi | `ex-gauge-with-target-chart` |

## Workflow

1. Add/update `src/registry/examples/ex-*.tsx`.
2. Register in `registry-example.ts` with `registryDependencies: ["@beecharts/<primitive>-chart"]`.
3. Add `<ComponentPreview />` in primitive `static.mdx` (beecharts-docs skill for MDX details).
4. Run `pnpm run registry:fresh`.
5. Verify: `pnpm run audit:previews`, `pnpm test` (if compilers touched).

## Checklist

- [ ] No new `src/registry/charts/<recipe>-chart.tsx` unless truly custom geometry.
- [ ] Data prep in `chart-recipes.ts` if reused.
- [ ] Example + preview only on primitive doc page.
- [ ] Registry build + audits green.
- [ ] Update `skills/consumer/beecharts/` if public API changed, then `pnpm sync:skills`.

## Verification

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm run audit:previews
pnpm run audit:registry-boundary
pnpm run registry:fresh
```
