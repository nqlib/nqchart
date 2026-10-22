---
name: nqchart-fixed-legend-duplicate-datakey
description: >-
  Fixed: composed Area + Line on the same dataKey made the HTML legend emit
  two children with key `otd`. Dedupe legend rows by dataKey.
skill: nqchart-fixed
kind: fix
domain: legend
status: fixed
fixed: "2026-08"
tags: legend, duplicate key, composed, Area, Line, otd, React key
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: legend duplicate dataKey React keys

**Domain:** [legend](../domains/legend.md)  
**Status:** fixed (2026-08)  
**Verify:** `/bi-check` section 1 (Area + Line `dataKey="otd"`) — one “On-time
delivery” legend row, no `Encountered two children with the same key`.
`pnpm test` — `uniqueLegendSeriesKeys`.

## Symptoms

- Console: `Encountered two children with the same key, \`otd\`` at
  `ChartLegendContent` (`ui/legend.tsx`).
- `/bi-check` composed chart: `<Area dataKey="otd" />` + `<Line dataKey="otd" />`.

## Root cause

`seriesKeysFromParts` listed every series part’s `dataKey`. Fill-under-line
reuses the same config key for Area and Line, so React got two `key="otd"`.

## Fix (do not revert)

| File | Change |
|------|--------|
| `ui/legend.tsx` | `uniqueLegendSeriesKeys` — first dataKey wins; used from parts, `segmentKeys`, and `ChartLegendContent` |
| `ui/__tests__/legend-series-keys.test.ts` | Area+Line `otd` collapses to one key |

One legend row is correct: both marks are the same series. Isolate still uses
`dataKey`. ECharts `id duplicates: otd` is a separate series-id collision (not
this React warning).
