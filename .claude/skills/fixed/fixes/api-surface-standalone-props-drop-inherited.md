---
name: nqchart-fixed-api-standalone-props-drop-inherited
description: >-
  Fixed: chart roots with standalone props types silently omit interaction
  props that createCartesianChart already wires (onMarkClick, onBrushChange,
  onChartReady, chartRef). Extend CartesianChartBaseProps; guard with check:api.
skill: nqchart-fixed
kind: fix
domain: api-surface
status: fixed
fixed: "2026-08"
tags: onMarkClick, props, TypeScript, CartesianChartBaseProps, check:api, composed, line, area
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: standalone props type drops inherited factory props

**Domain:** [api-surface](../domains/api-surface.md)  
**Status:** fixed (2026-08)  
**Verify:** `pnpm run build:npm` (includes `check:api`) — probe must accept `onMarkClick` on bar, line, area, composed, pie, scatter.

## Symptoms

- Source wires `onMarkClick: shell.onMarkClick` but TypeScript consumers get excess-property errors on `NQLineChart` / `NQAreaChart` / `NQComposedChart`.
- Grep over `.d.ts` / `.tsx` misses the bug on roots that correctly inherit `CartesianChartBaseProps` (false miss on bar).
- SecoLab ST-289 blocked: cannot type-check a composed cross-filter renderer.

## Root cause

`createCartesianChart` requires `TChartProps extends CartesianChartBaseProps`, but optional base fields need not appear on a narrower standalone props alias. Line / area / composed re-declared a local props object with only root-specific fields, so the exported wrapper type locked consumers out while runtime still worked.

## Fix (do not revert)

| File | Change |
|------|--------|
| `charts/{line,area,composed}-chart.tsx` | `Omit<CartesianChartBaseProps, "config"> & { … root-only }` like bar |
| `scripts/check-api.mjs` | Compile probe against `dist/types/` after `build:types` |
| `package.json` | `check:api` in `build:npm` |

## Wrong fixes (rejected)

- Adding `onMarkClick?` three more times on each standalone type — diverges again when the next base prop lands.
- Asserting via grep of source — inherits are invisible; only `tsc` against `dist/types` is honest.
