---
name: nqchart-fixed-api-surface-axis-scale-time-log
description: >-
  Fixed: scale="time" put every point in 1970, one 0 collapsed a log axis, and the
  scatter chart ignored scale / domain / reversed. Points on a time axis are [t, v].
skill: nqchart-fixed
kind: fix
domain: api-surface
status: fixed
fixed: "2026-11"
tags: scale, time, log, 1970, epoch, axis extent, zero, stack, scatter, domain, reversed
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: time and log axis scales

**Domain:** [api-surface](../domains/api-surface.md)  
**Status:** fixed (2026-11)  
**Verify:** `pnpm test` (`axis-scales.test.ts`). It reads the real axis extent with ECharts SSR.
Preview: `ex-line-time-axis`, `ex-scatter-log-axis`.

## Symptoms

- `<XAxis scale="time" />` on a line or area chart: every point sits at 1970-01-01, and the
  axis labels show milliseconds.
- `<YAxis scale="log" />` with one 0 value: the axis goes from 1 to 10, and the tall bars go
  off the plot.
- `<XAxis scale="log" />` on `NQScatterChart` does nothing. `domain` and `reversed` do nothing.
- `scale="time"` on a bar chart: the bars lose their category places.

## Root cause

- `applyAxisPartToOption` set the ECharts axis `type` from `scale` and did nothing else. The
  series data stayed plain values (`[1, 2, 3]`). On a time axis, ECharts reads the data
  index as the time, so the points land at 1, 2, and 3 ms after the epoch.
- A log axis has no position for 0. ECharts 5.6 then computes a wrong extent for the whole
  axis.
- `compile-scatter.ts` hard-coded `{ type: "value" }` for both axes and read only `dataKey`.

## Fix (do not revert)

| File | Change |
|------|--------|
| `echarts-core/cartesian-axes.ts` | `axisTypeFor(scale, role, { time })`: a category axis is `category` or (when the chart allows it) `time`; a value axis is `value` or `log`. A time axis drops `data` |
| `echarts-core/cartesian-series.ts` | `timeValue` (date-only string = local midnight), `logSafeValue` (≤ 0 → gap), `timeSeriesData` (`{ name, value: [t, v] }`, `null` in place for a bad date) |
| `compile-line.ts`, `compile-area.ts` | Time x axis sends `[t, v]` points; the brush is off |
| `compile-bar.ts`, `compile-composed.ts`, `compile-area.ts` | A series on a log axis has no `stack`; percent normalisation does not run |
| `compile-scatter.ts` | Both axes go through `applyAxisPartToOption`; a point at ≤ 0 on a log axis is dropped |
| `echarts-tooltip.ts` | Axis tooltip reads `v` of `[t, v]` on a time axis; `NQ_TOOLTIP_VALUE` gives a scatter point a readable value |

## Wrong fixes (rejected)

- Clamping 0 to a small number such as 0.1 on a log axis. It draws a value that is not in
  the data and stretches the axis down by orders of magnitude.
- Converting dates to category strings. The gaps between the dates then look equal.
