---
name: nqchart-fixed-labels-radial-ring-orientation-clip
description: >-
  Fixed: concentric radial ring names vertical/upside-down and stacked; semi/full
  polar clipped at canvas edge. rotate must be 0; default outer radius insets.
skill: nqchart-fixed
kind: fix
domain: labels
status: fixed
fixed: "2026-08"
tags: radial, concentric, semi, axisLabel, rotate, startAngle, clip
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: concentric radial — upright ring names + no canvas clip

**Domain:** [labels](../domains/labels.md)  
**Status:** fixed (2026-08)  
**Verify:** `/docs/radial-chart/static` — full + semi concentric; names horizontal on the start spoke; tracks not cut off. `startAngle={45}` moves the spoke, names stay upright.

## Symptoms

- Ring names stack into an illegible pile; concentric arcs touch with no gap.
- Semi variant: lower half of track circles clipped by the card edge.
- Full labeled: outer ring / names cramped against the canvas.
- Custom `startAngle` should tilt names; locked-horizontal ignores the spoke.

## Root cause

1. Fixed `barWidth` with no `barCategoryGap` packed ring bands flush — arcs touch and label anchors collide.
2. Label `rotate` either mismatched AxisBuilder (world rotation **equals** `rotate`) or locked to `0`, so names ignored `startAngle`.
3. Default `outerRadius: "100%"` (and semi center at `70%` with full-circle tracks) drew past the canvas.

## Fix (do not revert)

| File | Change |
|------|--------|
| `compile-radial-bar.ts` | `barCategoryGap: "48%"` on track + rings. `rotate: startAngle - 90` (perpendicular to spoke so glyph height is radial). `fontSize` capped to `barSize - 4`. Wide annular span: inner `18%`, full labeled outer `90%`, semi labeled `52%`. `startAngle` prop via `variantAngles`. |
| `radial-chart.tsx` / `parts/types.ts` / `use-compiled-option.ts` | Public `startAngle` → `radialStartAngle`. |

## Wrong fixes (rejected)

- **`rotate: startAngle` (parallel to spoke)** — word *length* runs through neighboring rings; small font cannot fix that.
- **`rotate: 0` always** — ignores custom start angles (45°, etc.).
- **`rotate: startAngle + 90`** — upside-down at full default.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-radial.test.ts
```
