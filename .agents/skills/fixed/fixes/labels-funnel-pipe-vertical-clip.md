---
name: nqchart-fixed-labels-funnel-pipe-vertical-clip
description: >-
  Fixed: vertical pipe funnel stage labels clipped at the left canvas edge
  ("pplication"). Wider left band + right-align toward the ribbon.
skill: nqchart-fixed
kind: fix
domain: labels
status: fixed
fixed: "2026-08"
tags: funnel, pipe, label, clip, vertical, overflow
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: vertical pipe funnel — clipped stage labels

**Domain:** [labels](../domains/labels.md)  
**Status:** fixed (2026-08)  
**Verify:** `/docs/funnel-chart/static` → `ex-vertical-pipe-funnel-chart` — full names (`Application`, not `pplication`); labels sit in the left gutter, right-aligned to the ribbon.

## Symptoms

- Vertical `connection="pipe"` labels clip on the left (`Application` → `pplication`).
- Centered text in a ~44px left band overflows the canvas.

## Root cause

Pipe custom series placed labels at `padL / 2` with `textAlign: "center"` and `PIPE_LABEL_BAND = 44`. Two-line mark labels at 11px are wider than that band, so glyphs paint past `x = 0` and the host canvas clips them.

## Fix (do not revert)

| File | Change |
|------|--------|
| `compile-funnel.ts` | Separate `PIPE_LABEL_BAND_V` (100) / `_H` (40). Vertical: `textAlign: "right"`, `x = padL - PIPE_LABEL_GAP` so names grow left into the band from the ribbon. |
| `compile-funnel.test.ts` | Asserts vertical label align + left pad for `Application`. |

## Wrong fixes (rejected)

- **Only `clip: false` on the series** — still clips at the chart DOM/canvas edge.
- **Truncate / ellipsis names** — hides real stage titles; band + align is enough.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-funnel.test.ts
```
