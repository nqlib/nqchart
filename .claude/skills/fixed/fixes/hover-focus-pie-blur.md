---
name: nqchart-fixed-hover-focus-pie-blur
description: >-
  Fixed: pie hover dims wrong slice, flicker between adjacent wedges. pieFocus preset,
  emphasis.disabled, animationDurationUpdate 0, pie-hover-focus.ts microtask repair.
skill: nqchart-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-08"
tags: pie, hover, blur, flicker, emphasis-disabled, animationDurationUpdate
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: pie — hover dim / flicker / stale slices

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-08)  
**Verify:** `/docs/pie-chart/static` or showcase `/charts` pie — hover each slice; hovered slice **keeps its color**; siblings dim to 0.2; no flicker when moving across boundaries.

## Symptoms

- Hovered pie **slice dims** with siblings (should stay at 1.0).
- **Flicker** when moving between adjacent wedges (native high-down + layout tween).
- **Stale bright slices** when pointer skips `mouseout` between segments.
- Same class as funnel/treemap: native + repair racing.

## Root cause

1. ECharts pie **native high-down** races NQChart blur sync on adjacent wedges.
2. Default **`animationDurationUpdate`** can tween geometry on hover updates → flicker.
3. **`__highByOuter`** leaves stale emphasis when moving quickly between slices.

## Fix (do not revert)

| File | Change |
|------|--------|
| `src/registry/echarts-core/emphasis-presets.ts` | `pieFocus()` (= funnel pattern): `itemFocus` + **`emphasis.disabled: true`**, `stateAnimation.duration: 0`, `animationDurationUpdate: 0`. |
| `src/registry/echarts-core/compile-pie.ts` | Spread `pieFocus()` instead of bare `itemFocus`. |
| `src/registry/echarts-core/apply-chart-animation.ts` | Pie case keeps `animationDurationUpdate: 0`. |
| `src/registry/echarts-core/pie-hover-focus.ts` | Reset all slices; **`enterBlur` on non-hovered only** — hovered stays **normal**. `schedulePieHoverFocusRepair` via `queueMicrotask`. `resetPieHoverFocus` on globalout. |
| `src/registry/echarts-core/use-nq-echarts.ts` | Pie `mouseover` → `schedulePieHoverFocusRepair`; `globalout` → `resetPieHoverFocus`. |

## Wrong fixes (rejected)

- **Native `itemFocus` only** — adjacent wedges skip mouseout; flicker / stale bright slices.
- **Runtime repair without `emphasis.disabled`** — double pipeline flicker (same as funnel/treemap).

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-pie.test.ts
```

Hover: one slice normal (opacity 1), rest blur (0.2).
