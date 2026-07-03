---
name: nqchart-fixed-hover-focus-treemap-flicker-vanish
description: >-
  Fixed: treemap hover flicker and hovered tile vanishing. emphasis.disabled, blur-only
  siblings, animationDurationUpdate 0, treemap-hover-focus.ts microtask repair.
skill: nqchart-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-06"
tags: treemap, flicker, vanish, hover, blur, emphasis-disabled, animationDurationUpdate
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: treemap — hover flicker and hovered tile vanishes

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-06)  
**Verify:** `/docs/treemap-chart/static` — hover leaf tiles; no flicker; hovered tile **keeps its color**; siblings dim to 0.2.

## Symptoms

- **Flicker** / layout feel when moving between tiles (ECharts default layout tween + competing hover handlers).
- **Hovered tile disappears** or looks like empty gap (wrong fill on emphasis).
- Logs showed `normal: 18, blur: 0` (blur lost) or `emphasis: 5` (stale multi-emphasis) when native + repair fought each other.
- With `enterEmphasis` on hovered tile: `hoverState: 2` but tile visually gone — treemap **emphasis bg fill = gap borderColor**.

## Root cause

1. ECharts treemap default **`animationDurationUpdate: 900ms`** re-layout on updates → flicker (mitigated at compile + `apply-chart-animation.ts`).
2. **Native `handleGlobalMouseOverForHighDown`** and NQChart repair both run → race; blur not applied or double paint.
3. Treemap **emphasis itemStyle** on bg/content replaces fill with **gap color** — emphasized leaf looks vanished. Contract only needs **normal = full color**, **blur = 0.2** on siblings.
4. Adjacent tiles skip `mouseout` → stale states unless **full series sync** each hover.

## Fix (do not revert)

| File | Change |
|------|--------|
| `src/registry/echarts-core/emphasis-presets.ts` | `treemapFocus()`: `itemFocus({ dimLabel: true })`, `stateAnimation.duration: 0`, `animationDurationUpdate: 0`, **`emphasis.disabled: true`** (disable native high-down; NQChart owns hover). |
| `src/registry/echarts-core/compile-treemap.ts` | Spread `treemapFocus()`; borders on series/`levels` only; no `colorSaturation` / `colorAlpha`; `sort: false`. |
| `src/registry/echarts-core/apply-chart-animation.ts` | Treemap case keeps `animationDurationUpdate: 0`. |
| `src/registry/echarts-core/treemap-hover-focus.ts` | Phase 1: `leaveEmphasis` + `leaveBlur` on **all** tiles. Phase 2: **`enterBlur` on non-hovered only** — hovered stays **normal** (not `enterEmphasis`). `scheduleTreemapHoverFocusRepair` coalesces via `queueMicrotask`. `resetTreemapHoverFocus` on globalout. |
| `src/registry/echarts-core/use-nq-echarts.ts` | Treemap `mouseover` → `scheduleTreemapHoverFocusRepair`; `globalout` → `resetTreemapHoverFocus`. |

## Wrong fixes (rejected by runtime evidence)

- **`enterEmphasis` on hovered treemap tile** — emphasis styles hide tile color (gap fill on bg).
- **Double rAF repair only** without `emphasis.disabled` — native pipeline still races repair (`normal:18 blur:0`).
- **`animationDurationUpdate` alone** — flicker/state issues remain without runtime sync + disabled native emphasis.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-treemap.test.ts
```

Expected steady hover: hovered tile `hoverState: 0` (normal), `contentOpacity: 1`; ~3 normal + ~18 blur graphic elements per tree size.
