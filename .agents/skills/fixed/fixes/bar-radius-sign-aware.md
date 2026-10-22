---
name: nqchart-fixed-bar-radius-sign-aware
description: >-
  Fixed: negative bars and mixed stacks rounded the zero line. Radius is now
  per datum, from the sign and the same-sign outer segment.
skill: nqchart-fixed
kind: fix
domain: bar-radius
status: fixed
fixed: "2026-10"
tags: borderRadius, negative, stack, samesign, composed, bar
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: bar corner radius follows the sign

**Domain:** [bar-radius](../domains/bar-radius.md)  
**Status:** fixed (2026-10)  
**Verify:** `pnpm exec vitest run src/registry/echarts-core/__tests__/compile-bar.test.ts src/registry/echarts-core/__tests__/compile-composed.test.ts`

## Symptoms

- A bar at -8000 is rounded at 0 and square at the far end.
- A stack of a gain and a loss rounds both segments on the zero line. A single stacked segment can look like a pill.

## Root cause

Composed bars used one series-level radius, `[r, r, 0, 0]`, for every datum. Bar charts already set a per-datum radius, but `buildStackCornerRoles` only looked at values `> 0` and treated stack order as one pile. ECharts `stackStrategy: "samesign"` draws the positive stack and the negative stack apart, both starting at zero, so the segment on the zero line was the one that got the radius. The `"only"` role also rounded all four corners.

## Fix (do not revert)

| File | Change |
|------|--------|
| `bar-radius.ts` | `signedBarBorderRadius`. Stack roles are per sign; only the last non-zero segment of that sign is outer. `"only"` is no longer a pill. |
| `compile-bar.ts` | Pass the datum value into `barItemBorderRadius`. |
| `compile-composed.ts` | Per-datum `itemStyle.borderRadius` using the same roles. No series-level radius. |

Zero stays square. The end on the zero line stays square. Horizontal bars round the right end when positive and the left end when negative.
