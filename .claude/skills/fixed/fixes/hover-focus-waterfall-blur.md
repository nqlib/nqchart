---
name: nqchart-fixed-hover-focus-waterfall-blur
description: >-
  Fixed: waterfall hover dims wrong column, flicker, stale bright bars. waterfallColumnFocus
  preset, emphasis.disabled, waterfall-hover-focus.ts microtask repair by category index.
skill: nqchart-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-06"
tags: waterfall, hover, blur, flicker, emphasis-disabled, stacked-bar, index-focus
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: waterfall — hover dim / flicker / stale columns

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-06)  
**Verify:** `/docs/waterfall-chart/static` — hover each column; hovered bar **keeps its color**; siblings dim to 0.2; no flicker.

## Symptoms

- Hovered waterfall **column dims** with siblings (should stay at 1.0).
- **Flicker** when moving between categories (native high-down + stacked bar races).
- **Stale bright columns** when pointer skips `mouseout` between bars.
- Same class of bugs as funnel/treemap: native + repair racing, blur not applied.

## Root cause

1. Waterfall uses **two stacked bar series** (silent placeholder + `__wf_values__`); native index focus races on the values series.
2. **`__highByOuter`** leaves stale emphasis when moving quickly between categories.
3. With `emphasis.disabled: false`, native emphasis fights runtime repair (funnel/treemap pattern).

## Fix (do not revert)

| File | Change |
|------|--------|
| `src/registry/echarts-core/emphasis-presets.ts` | `waterfallColumnFocus()`: `cartesianColumnFocus()`, `stateAnimation.duration: 0`, `animationDurationUpdate: 0`, **`emphasis.disabled: true`**. |
| `src/registry/echarts-core/compile-waterfall.ts` | Spread `waterfallColumnFocus()` on `__wf_values__` series. |
| `src/registry/echarts-core/waterfall-hover-focus.ts` | Reset all value bars; **`enterBlur` on non-hovered categories only** — hovered stays **normal**. `scheduleWaterfallHoverFocusRepair` via `queueMicrotask`. `resetWaterfallHoverFocus` on globalout. |
| `src/registry/echarts-core/use-nq-echarts.ts` | Bar `mouseover` on `__wf_values__` → `scheduleWaterfallHoverFocusRepair`; `globalout` → `resetWaterfallHoverFocus`. |

## Wrong fixes (rejected)

- **Native `cartesianColumnFocus` only** — stacked waterfall races native high-down; stale bright columns.
- **Runtime repair without `emphasis.disabled`** — double pipeline flicker (same as funnel/treemap).
- **Repair placeholder series** — silent/invisible; only `__wf_values__` needs sync.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-waterfall.test.ts
```

Hover: one column normal (opacity 1), rest blur (0.2).
