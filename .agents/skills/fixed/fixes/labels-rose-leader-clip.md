---
name: nqchart-fixed-labels-rose-leader-clip
description: >-
  Fixed: rose radial leader lines float mid-air and category names truncate
  ("S…", "…"). 100% polar radius + zero-thickness label pie clipped labelLine.
skill: nqchart-fixed
kind: fix
domain: labels
status: fixed
fixed: "2026-07"
tags: rose, radial, labelLine, leader, truncate, overflow, pie-overlay
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: rose radial — floating leaders / truncated labels

**Domain:** [labels](../domains/labels.md)  
**Status:** fixed (2026-07)  
**Verify:** `/docs/radial-chart/static` → `layout='rose'` — each petal has a full name; leader touches petal envelope and label text.

## Symptoms

- Leader polylines float between petals and text — neither end connects.
- Names ellipsize (`Safari` → `S…`, `Edge` → `…`) or vanish at the canvas edge.
- After the 70% gutter fix: labels readable, but leaders still stop short of petal tips (worse on short petals).

## Root cause

1. Rose default `outerRadius` was `"100%"`. Pie-style `labelLine` draws *outside* the series radius, so length + length2 + text were clipped mid-stroke.
2. The silent label overlay used `radius: [r, r]` (zero-thickness ring). Degenerate pie sectors break labelLine anchor geometry.
3. A **single** label pie at the polar outer envelope anchors every leader on the max circle. Petal tips sit at `value / radiusMax` of that radius — short petals leave a gap; the 1.05 axis headroom gaps the largest petal too.

## Fix (do not revert)

| File | Change |
|------|--------|
| `src/registry/echarts-core/compile-radial-bar.ts` | One silent `__rose_labels__` pie (equal slices) for real `avoidLabelOverlap` + `labelLayout.moveOverlap`. Leader air gap via `length` / `length2` / `distanceToLabelLine`. Default rose outer `78%`. Concentric: `axisLabel.margin` + `hideOverlap`. |

## Wrong fixes (rejected)

- **Only lengthen `labelLine.length`** — still clips at 100% canvas edge; does not close the tip gap.
- **One equal-slice pie at outer radius** — leaders share the envelope; short petals stay disconnected.
- **Axis labels instead of pie overlay** — polar bar has no `labelLine`; angleAxis text does not draw leaders.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-radial.test.ts
```
