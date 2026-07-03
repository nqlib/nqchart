---
name: nqchart-dev
description: >-
  Contribute to the NQChart repository — engine, registry, examples,
  chart-recipes, and compilers. Use when adding charts, registry items, or
  examples in nqchart. Covers primitives only, no duplicate BI chart modules.
  NOT for integrating @nqchart/* in external consumer apps.
metadata:
  author: nqchart
  version: "1.0.0"
---

# NQChart — development skill (engine + registry)

> Docs site work: see [nqchart-docs](../nqchart-docs/SKILL.md).  
> Consumer integration: see [skills/consumer/nqchart](../../../skills/consumer/nqchart/SKILL.md).

This skill is for **maintainers** of the nqchart repository only.

Read **[chart-catalog.md](./chart-catalog.md)** for the chart list and example index.  
Internal vault: [docs/index.md](../../../docs/index.md).  
DoD: [docs/product/ai-contract.md](../../../docs/product/ai-contract.md).  
**Fixing regressions:** search [fixed/index.md](../fixed/index.md) before changing hover, compile, or ECharts state code.

## In / out of scope

| In scope | Out of scope |
|----------|--------------|
| `src/registry/**`, compilers, chart-recipes | External app integration workflow |
| Registry examples (`ex-*`), blocks | MDX pages, landing (→ nqchart-docs) |
| Vitest compiler tests | Consumer skill prose (→ edit SOT + sync) |

## Rules

1. **One primitive per chart family** — bar, line, area, composed, scatter, radial, pie, radar, treemap, waterfall, funnel, sparkline, heatmap, calendar.
2. **BI shapes = data helpers + examples** — use `src/registry/lib/chart-recipes.ts`, not new chart components.
3. **Examples live on the primitive doc** — register in `registry-example.ts`; embed with `<ComponentPreview name="ex-…" />` in matching `static.mdx`.
4. **No duplicate doc nav** — do not add `gauge-chart`, `histogram-chart`, etc. to `meta.json`.
5. **Registry boundary** — `src/registry/**` must not import `src/components/**`. Run `pnpm run audit:registry-boundary`.
6. **ECharts engine** — compilers are pure fns in `compile-*.ts` + `useCompiledOption`. No Recharts. For correct ECharts `option` shapes, consult the **[echarts-ai-skill](../echarts-ai-skill/SKILL.md)** reference (`examples/*.option.json`, `src/core/spec-to-option.ts`). Reference only — build via the compilers, **not** its CLI.

## chart-recipes

| Helper | Use with | Example block |
|--------|----------|---------------|
| `binForHistogram(values, binCount)` | `NQBarChart` | `ex-histogram-chart` |
| `prepareBulletRow(label, opts)` | `NQBarChart` horizontal | `ex-bullet-chart` |
| `prepareParetoData(rows, nameKey, valueKey)` | `NQComposedChart` | `ex-pareto-chart` |
| `prepareBoxPlotRow(category, samples)` | `NQComposedChart` | `ex-boxplot-chart` |
| `prepareHeatmapCells(rows, cols, matrix)` | `NQHeatmapChart` | `ex-heatmap-chart` |
| `prepareCalendarWorkloadCells(days)` | `NQCalendarChart` | `ex-calendar-workload-chart` |
| `normalizeGaugeValue(value, min, max)` | `NQRadialChart` semi | `ex-gauge-with-target-chart` |

## Workflow

1. Add/update `src/registry/examples/ex-*.tsx`.
2. Register in `registry-example.ts` with `registryDependencies: ["@nqchart/<primitive>-chart"]`.
3. Add `<ComponentPreview />` in primitive `static.mdx` (nqchart-docs skill for MDX details).
4. Run `pnpm run registry:fresh`.
5. Verify: `pnpm run audit:previews`, `pnpm test` (if compilers touched).

## Checklist

- [ ] No new `src/registry/charts/<recipe>-chart.tsx` unless truly custom geometry.
- [ ] Data prep in `chart-recipes.ts` if reused.
- [ ] Example + preview only on primitive doc page.
- [ ] Registry build + audits green.
- [ ] Update `skills/consumer/nqchart/` if public API changed, then `pnpm sync:skills`.

## Verification

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm run audit:previews
pnpm run audit:registry-boundary
pnpm run registry:fresh
```
