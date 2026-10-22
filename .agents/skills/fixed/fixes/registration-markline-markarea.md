---
name: nqchart-fixed-registration-markline-markarea
description: >-
  Fixed: ReferenceLine compiled to a markLine but no family registered
  MarkLineComponent (seen by secolab, SECO-1289). ReferenceBand had the same gap
  with MarkAreaComponent.
skill: nqchart-fixed
kind: fix
domain: registration
status: fixed
fixed: "2026-10"
tags: ReferenceLine, ReferenceBand, markLine, markArea, MarkLineComponent, MarkAreaComponent, echarts.use, getEcharts
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: ReferenceLine and ReferenceBand draw nothing

**Domain:** [registration](../domains/registration.md)  
**Status:** fixed (2026-10, 0.4.0)  
**Verify:** `pnpm test`; `node scripts/smoke-dist.mjs`; a `<ReferenceLine y={…} />` in a bar, line, area, composed or scatter chart draws its dashed line.

## Symptoms

- `<ReferenceLine y={50} label="Target" />` compiles (the option has a silent series with `markLine.data`) but no line shows.
- `<ReferenceBand />` shows no band.
- A consumer works around it by calling `echarts.use([MarkLineComponent])` itself (secolab `chart-viz.tsx`, SECO-1289).

## Root cause

Plan 016 made each family register only the modules it draws. `reference-marks.ts`
emits `markLine` and `markArea` on a synthetic `type: "line"` series, but no family listed
`MarkLineComponent` or `MarkAreaComponent`. ECharts ignores a component key whose
component is not registered. The bar and scatter families also lacked `LineChart`, so
ECharts dropped the synthetic series itself, with its marks.

## Fix (do not revert)

| File | Change |
|------|--------|
| `bar-chart.tsx`, `line-chart.tsx`, `area-chart.tsx`, `composed-chart.tsx`, `scatter-chart.tsx` | `MarkLineComponent` and `MarkAreaComponent` in the family's `*_ECHARTS_MODULES` |
| `bar-chart.tsx`, `scatter-chart.tsx` | `LineChart` too: the synthetic reference series is a line series (about +9 % gzip; baseline rewritten) |
| `headless/render-to-svg.ts` | The headless render registers both too |

## Wrong fixes (rejected)

- Registering the components in `BASE` (`echarts-init.ts`): pie, funnel and treemap never draw reference marks and would pay for them.
- A top-level `echarts.use([...])` in a family file: `"sideEffects": false` lets a bundler drop it.
- Registering only the mark components in bar and scatter: the marks ride on a `type: "line"` series, which ECharts drops when `LineChart` is not registered (verified with an SSR render).
- Making the synthetic series a `bar` series in the bar family: an empty bar series still takes a slot in each category band and narrows the real bars.
