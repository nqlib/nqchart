---
name: nqchart-fixed-reference-marks-unregistered-single-axis
description: >-
  Fixed: reference marks did not draw, shared the first yAxisId, and stayed
  off-plot when they sat outside the data range.
skill: nqchart-fixed
kind: fix
domain: reference-marks
status: fixed
fixed: "2026-10"
tags: MarkLineComponent, MarkAreaComponent, yAxisId, includeInDomain, reference-marks
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: reference marks silent, single-axis, and clipped

**Domain:** [reference-marks](../domains/reference-marks.md)
**Status:** fixed (2026-10)
**Verify:** `pnpm test` (`reference-marks.test.ts`).

## Symptoms

- A `ReferenceLine` compiles to `markLine` and nothing is drawn. A band still fails after the host registers `MarkLineComponent` itself.
- Every mark uses the first part's `yAxisId`, so a right-axis target is on the wrong scale.
- A mark above the data max is off the plot. ECharts does not grow an axis for `markLine` / `markArea`.

## Root cause

`getEcharts` never registered `MarkLineComponent` or `MarkAreaComponent`. `buildReferenceSeries` emitted one series whose `yAxisIndex` came from the first mark with a `yAxisId`. Axis `min` / `max` were left unset, so the data extent clipped the mark.

## Fix (do not revert)

| File | Change |
|------|--------|
| `echarts-init.ts` | `MarkLineComponent` and `MarkAreaComponent` on the core module list |
| `reference-marks.ts` | One series per axis; `includeInDomain` min/max functions; open `null` edges |
| `nq-mark-event.ts` | `<chartId>-ref-<index>` still counts as a reference series |

Hosts can drop their own `MarkLineComponent` registration.
