---
name: nqchart-fixed-hover-focus-funnel-blur
description: >-
  Fixed: funnel hover dims wrong stage, flicker, stale emphasis. funnelFocus preset,
  emphasis.disabled, animationDurationUpdate 0, funnel-hover-focus.ts microtask repair.
skill: nqchart-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-06"
tags: funnel, hover, blur, flicker, emphasis-disabled, animationDurationUpdate
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: funnel — hover dim / flicker / stale stages

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-06)  
**Verify:** `/docs/funnel-chart/static` — hover each stage; hovered stage **keeps its color**; siblings dim to 0.2; no flicker.

## Symptoms

- Hovered funnel **stage dims** with siblings (should stay at 1.0).
- **Flicker** when moving between adjacent stages (native high-down + layout tween).
- **Stale bright stages** when pointer skips `mouseout` between segments.
- Same class of bugs as treemap: native + repair racing, blur not applied.

## Root cause

1. ECharts funnel **native high-down** and NQChart blur sync can **race** on adjacent segments.
2. Default **`animationDurationUpdate`** can tween segment geometry on hover updates → flicker.
3. **`__highByOuter`** leaves stale emphasis when moving quickly between stages.
4. With `emphasis.disabled: false`, native emphasis fights runtime repair (treemap pattern).

## Fix (do not revert)

| File | Change |
|------|--------|
| `src/registry/echarts-core/emphasis-presets.ts` | `funnelFocus()`: `itemFocus({ dimLabel: true })`, `stateAnimation.duration: 0`, `animationDurationUpdate: 0`, **`emphasis.disabled: true`**. |
| `src/registry/echarts-core/compile-funnel.ts` | Spread `funnelFocus()` instead of bare `itemFocus`. |
| `src/registry/echarts-core/apply-chart-animation.ts` | Funnel case keeps `animationDurationUpdate: 0`. |
| `src/registry/echarts-core/funnel-hover-focus.ts` | Reset all segments; **`enterBlur` on non-hovered only** — hovered stays **normal**. `scheduleFunnelHoverFocusRepair` via `queueMicrotask`. `resetFunnelHoverFocus` on globalout. |
| `src/registry/echarts-core/use-nq-echarts.ts` | Funnel `mouseover` → `scheduleFunnelHoverFocusRepair`; `globalout` → `resetFunnelHoverFocus`. |

## Wrong fixes (rejected)

- **Native `itemFocus` only** — adjacent segments skip mouseout; stale bright stages.
- **Runtime repair without `emphasis.disabled`** — double pipeline flicker (same as treemap).
- **`enterEmphasis` on hovered segment** — unnecessary when hovered tile stays normal at full color.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-funnel.test.ts
```

Hover: one stage normal (opacity 1), rest blur (0.2).
