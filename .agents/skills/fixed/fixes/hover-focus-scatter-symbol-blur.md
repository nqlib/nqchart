---
name: beecharts-fixed-hover-focus-scatter-symbol-blur
description: >-
  Fixed: scatter hovered dot dims and stale multi-focus. Symbol path blur, __highByOuter
  sync, per-row itemFocus, and scatter-hover-focus.ts runtime repair.
skill: beecharts-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-06"
tags: scatter, symbol, hover, blur, emphasis, stale-focus, childAt
metadata:
  author: beecharts
  version: "1.0.0"
---

# Fix: scatter — hovered dot dims / stale bright siblings

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-06)  
**Verify:** `/docs/scatter-chart/static` — hover red (Mobile) and green (Desktop) dots; only one dot bright, others 0.2.

## Symptoms

- Hovered scatter **point dims to 0.2** with everything else (should stay at 1.0).
- Moving to another point leaves **previous dots bright** (stale emphasis).
- Debug: `pathHoverState: 1` (blur) on hovered path while group shows emphasis; `normal` count climbs across hovers.

## Root cause

1. ECharts **Symbol** uses a group dispatcher + path child (`childAt(0)`). `blurSeries` blurs the path even on the focused point.
2. `enterEmphasis(path)` sets `__highByOuter`; on the next hover ECharts **skips blurring** those paths → stale bright dots.
3. Manual emphasis without `instance.__needsUpdateStatus = true` + `wakeUp()` leaves hover flags set but **opacity not repainted**.

## Fix (do not revert)

| File | Change |
|------|--------|
| `src/registry/echarts-core/scatter-hover-focus.ts` | `repairScatterHoverFocus`: loop **all** symbols — hovered path gets `leaveBlur` + `enterEmphasis`; others `leaveEmphasis` + `enterBlur`; `markChartStatesDirty`. `resetScatterHoverFocus` on globalout. |
| `src/registry/echarts-core/use-bee-echarts.ts` | On scatter `mouseover`: double `requestAnimationFrame` → `repairScatterHoverFocus`. On `globalout`: `resetScatterHoverFocus`. |
| `src/registry/echarts-core/compile-scatter.ts` | Single merged series; **per-row** `itemFocus()` on data objects (Symbol `hasItemOption` quirk); `stateAnimation: { duration: 0 }`. |
| `src/registry/echarts-core/echarts-internals.d.ts` | Types for `echarts/lib/util/states.js` imports. |

## Wrong fixes (rejected by runtime evidence)

- Series-level `itemFocus` only (no per-row) — Symbol ignores series emphasis for object rows.
- `enterEmphasis` on hovered path **without** syncing all siblings — stale `__highByOuter`.
- Repair on group instead of **path** (`childAt(0)`) — opacity stays at blur level.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-scatter.test.ts
```

Hover: one dot `emphasis`, rest `blur`; hovered path opacity **1**.
