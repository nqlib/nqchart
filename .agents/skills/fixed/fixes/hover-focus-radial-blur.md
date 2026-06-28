---
name: beecharts-fixed-hover-focus-radial-blur
description: >-
  Fixed: radial/rose hover dims wrong ring, flicker across gaps. radialBarSeriesFocus
  emphasis.disabled, radial-hover-focus.ts series-level microtask repair.
skill: beecharts-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-06"
tags: radial, rose, polar, hover, blur, series-focus, emphasis-disabled, ring-gap
metadata:
  author: beecharts
  version: "1.0.0"
---

# Fix: radial bar / rose — hover dim / flicker / stale rings

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-06)  
**Verify:** `/docs/radial-chart/static` — hover each ring or petal; hovered arc **keeps its color**; siblings dim to 0.2; no gap flicker.

## Symptoms

- Hovered radial **ring dims** with siblings (should stay at 1.0).
- **Flicker** when moving between concentric rings or rose petals (per-item hit-testing across gaps).
- **Stale bright rings** when native series focus races BeeCharts blur sync.
- Gradient fills throw if emphasis tweens — must stay instant.

## Root cause

1. Radial charts model **one ECharts series per ring/petal** with `focus: "series"` — correct geometry, but native high-down still races repair.
2. Per-item focus across ring **gaps** causes dim thrashing (why series-per-ring exists).
3. **`__highByOuter`** leaves stale emphasis when moving quickly between rings.
4. With `emphasis.disabled: false`, native emphasis fights runtime repair (funnel/treemap pattern).
5. **SeriesModel options use `.get('stack')` / `.get('id')`** — reading `series.stack` directly made `isRadialRingSeries` always false, so repair never ran while native emphasis was disabled → no visible focus.

## Fix (do not revert)

| File | Change |
|------|--------|
| `src/registry/echarts-core/emphasis-presets.ts` | `radialBarSeriesFocus()`: `focus: "series"`, `stateAnimation.duration: 0`, `animationDurationUpdate: 0`, **`emphasis.disabled: true`**. |
| `src/registry/echarts-core/compile-radial-bar.ts` | Spread `radialBarSeriesFocus()` on each ring/petal series (unchanged structure). |
| `src/registry/echarts-core/radial-hover-focus.ts` | Reset all ring/petal graphics; **`enterEmphasis` on hovered series, `enterBlur` on siblings** (scatter-style). Detect rings via `series.get('coordinateSystem') === 'polar'`, not `series.stack`. `scheduleRadialHoverFocusRepair` via `queueMicrotask`. |
| `src/registry/echarts-core/use-bee-echarts.ts` | Polar bar `mouseover` on ring series → `scheduleRadialHoverFocusRepair`; `globalout` → `resetRadialHoverFocus`. |

## Wrong fixes (rejected)

- **`focus: "self"` per data item** — flicker across ring/petal gaps (official ECharts polar-bar anti-pattern).
- **Native `radialBarSeriesFocus` only** without `emphasis.disabled` — double pipeline flicker.
- **Repair track series** — silent `__radial_track__`; only ring/petal stacks need sync.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-radial.test.ts
```

Hover: one ring normal (opacity 1), rest blur (0.2).
