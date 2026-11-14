---
name: nqchart-fixed-labels-value-label-axis-max-clip
description: >-
  Fixed: a value label on a mark at the axis max ("+3" on a waterfall step at 60)
  was cut by the canvas edge. withValueLabelRoom reserves the room in the grid.
skill: nqchart-fixed
kind: fix
domain: labels
status: fixed
fixed: "2026-11"
tags: showLabels, value label, clip, grid top, grid right, axis max, waterfall, bar, line, area, composed
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: value label at the axis max is cut by the canvas edge

**Domain:** [labels](../domains/labels.md)  
**Status:** fixed (2026-11)  
**Verify:** `pnpm test` (`chart-grid.test.ts` "withValueLabelRoom", `compile-bar.test.ts`,
`compile-waterfall.test.ts`). Preview: the waterfall "Direction colors" example shows "+3".

## Symptoms

- A waterfall step that ends at the top tick (60) shows half of its "+3" label.
- A bar, line, area, or composed chart with `showLabels` cuts the label of the tallest mark.
- A horizontal bar or waterfall cuts the label of the longest row at the right edge.

## Root cause

ECharts draws a `top` or `right` label outside the grid rect. `containLabel: true` measures
only the axis labels. The nice axis max often equals the data max, so the label of that mark
goes past the 14px grid top, or past the 20px grid right in a horizontal chart.

## Fix (do not revert)

| File | Change |
|------|--------|
| `echarts-core/chart-grid.ts` | `withValueLabelRoom(grid, labels, { horizontal, pointsOnEdge, fontSize })`: top 28px for columns; right = label width + 9px for rows; half a label on the right for edge points |
| `echarts-core/series-labels.ts` | `valueLabelTexts(series, rows)`: the formatted text of each label that shows |
| `compile-waterfall.ts`, `compile-bar.ts`, `compile-line.ts`, `compile-area.ts`, `compile-composed.ts` | Wrap the grid in `withValueLabelRoom` |

The room applies only when a label shows. A chart without labels keeps its grid.

## Wrong fixes (rejected)

- Growing the value axis max by a percent. The room is in pixels, so a percent is too much
  on a tall card and too little on a short one. It also moves the nice ticks.
- `label.position: "insideTop"`. The label then covers the mark and loses its direction.

## Not covered

- A negative label below a mark at the axis min sits on the category axis labels. It stays
  on the canvas.
