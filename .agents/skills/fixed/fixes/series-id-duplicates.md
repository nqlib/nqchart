---
name: nqchart-fixed-series-id-duplicates
description: >-
  Fixed: composed Area + Line on the same dataKey threw `id duplicates: otd`
  at setOption. Uniquify the second series id; strip the suffix for clicks
  and legend isolate.
skill: nqchart-fixed
kind: fix
domain: series-id
status: fixed
fixed: "2026-08"
tags: id duplicates, otd, composed, Area, Line, setOption, seriesKey
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: ECharts series id duplicates

**Domain:** [series-id](../domains/series-id.md)  
**Status:** fixed (2026-08)  
**Verify:** `/bi-check` section 1 — no `id duplicates: otd`. Click the area or
line → `seriesKey: "otd"`. Legend isolate `otd` keeps both marks bright.
`pnpm test` — `series-identity`, `compile-composed`, `nq-mark-event`,
`legend-focus`.

## Symptoms

- Runtime: `id duplicates: otd` at `use-nq-echarts.ts` `instance.setOption`.
- `/bi-check` composed chart: `<Area dataKey="otd" />` + `<Line dataKey="otd" />`.

## Root cause

`compile-composed` set every series `id` to `dataKey`. Area and Line both
compile to `type: "line"` with `id: "otd"`. ECharts rejects duplicate ids.

## Fix (do not revert)

| File | Change |
|------|--------|
| `echarts-core/series-identity.ts` | `uniquifySeriesIds`, `dataKeyFromSeriesId`, `seriesMatchesLegendKey` |
| `echarts-core/compile-composed.ts` | uniquify after concatenating bar/line/area/whisker series |
| `echarts-core/nq-mark-event.ts` | `seriesKey = dataKeyFromSeriesId(seriesId)` |
| `echarts-core/legend-focus.ts` | match via `seriesMatchesLegendKey` so `otd__nq_area` stays bright |

First claim keeps `dataKey` (line, in compose order). Collision →
`${dataKey}__nq_<kind>`. Do not strip `__nq_reference__`, `__wf_*`, or
`nq-hover-trace-*`.

Related: HTML legend duplicate React keys — [legend-duplicate-datakey](./legend-duplicate-datakey.md).
