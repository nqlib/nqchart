---
name: nqchart-fixed-brush-band-edge-handles
description: >-
  Fixed: footer brush handles split bar groups mid-cluster. Left/right now
  anchor to category band start/end via indexToPlotPercent edge.
skill: nqchart-fixed
kind: fix
domain: brush
status: fixed
fixed: "2026-08"
tags: brush, boundaryGap, indexToPlotPercent, handles, bar group, slider
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: brush — handles frame whole category groups

**Domain:** [brush](../domains/brush.md)  
**Status:** fixed (2026-08)  
**Verify:** Bar chart with `showBrush` — left handle sits left of the first included group, right handle right of the last; selection no longer cuts between Desktop/Mobile in a pair.

## Symptoms

- Slider window edges land in the **middle** of a bar group (e.g. between green/red).
- Dimmed vs selected preview looks like half a cluster is in/out of range.

## Root cause

`indexToPlotPercent(..., boundaryGap: true)` always used band **center** (`index + 0.5`). Both handles shared that mapping, so the window bisected groups.

## Fix (do not revert)

| File | Change |
|------|--------|
| `chart-grid.ts` | `indexToPlotPercent` accepts `edge: "start" \| "center" \| "end"`. |
| `nq-chart-brush.tsx` | Left → `"start"`, right → `"end"`; drag delta uses `totalPoints` when `boundaryGap`. |

## Wrong fixes (rejected)

- **Shift handle CSS only** — pixel offsets don’t track category band width across widths/n.
- **Force `boundaryGap: false` on bars** — changes main chart layout, not brush framing.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/chart-grid.test.ts
```
