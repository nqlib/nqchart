---
name: nqchart-fixed-labels-gauge-axis-overlap
description: >-
  Fixed: gauge axis tick labels overlap on small cards. Viewport-aware stride
  hides alternate labels (0,20,40…) while keeping split ticks.
skill: nqchart-fixed
kind: fix
domain: labels
status: fixed
fixed: "2026-08"
tags: gauge, axisLabel, overlap, splitNumber, viewport, stride
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: gauge — thin axis labels when the dial is cramped

**Domain:** [labels](../domains/labels.md)  
**Status:** fixed (2026-08)  
**Verify:** `/docs/radial-chart` gauge examples in a ~300px card — labels read `0,20,40…100` (not every 10). Widen the host → every tick returns.

## Symptoms

- Semi-gauge dials show `0…100` every 10; mid-arc numbers pile on top of each other in small cards.
- Min/max still readable; middle ticks illegible.

## Root cause

ECharts gauge has no `axisLabel.hideOverlap` / `interval`. Default `splitNumber: 10` always paints every label. Arc spacing on a ~300px card is narrower than a two-digit glyph.

## Fix (do not revert)

| File | Change |
|------|--------|
| `gauge-axis-labels.ts` | AABB crown collision (`gaugeLabelsCollide`); `resolveGaugeLabelLayout` tries smaller fonts at stride 1 before stride 2/4; `formatGaugeAxisLabel` keeps ends. |
| `compile-gauge.ts` | `axisLabel.fontSize` + formatter; series `id: __gauge_dial_s{stride}_f{font}__`. |
| `use-nq-echarts.ts` | `seriesStructureKey` includes `id` so layout changes `replaceMerge` series — merge does not reliably replace `axisLabel.formatter` (stale dense labels after shrink). |
| `radial-chart.tsx` | ResizeObserver → bucketted `viewport` into `useCompiledOption`. |
| `parts/types.ts` / `use-compiled-option.ts` | Optional `viewport` on compile context. |

## Wrong fixes (rejected)

- **Always `splitNumber: 5`** — loses density on large dials and thins ticks, not just labels.
- **Formatter-only / id change without `seriesStructureKey` including `id`** — shrink-after-grow keeps old formatter via setOption merge.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/gauge-axis-labels.test.ts
```
