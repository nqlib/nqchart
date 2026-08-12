---
id: ST-010
epic: EP-004
title: "Mark click, legend select, brush, escape hatch"
status: done
priority: must
estimate: 5
owner: nqchart
plan: plans/009-bi-interaction-api.md
---

# ST-010 — Mark click, legend select, brush, escape hatch

As a BI board author,
I want one root-level mark click (with modifier keys), controllable legend selection, and
a public brush range API,
so that cross-filter and drill work without forking the library — and so an escape hatch
exists for the next unmet ECharts need.

## Acceptance criteria

- [x] `onMarkClick` on cartesian + pie roots carries category (raw), seriesKey, datum,
      value, index, modifiers (`shift`/`meta`/`alt`/`ctrl`)
- [x] Null marks / empty plot do not fire; pointer cursor only when bound
- [x] `<Legend selected onSelectChange />` controllable; uncontrolled default preserved
- [x] `useChartBrush` / `ChartBrushRange` exported; `onBrushChange` on brush roots
- [x] `onChartReady` + `chartRef` documented as unsupported surface
- [x] Consumer skill shows a cross-filter example; plan 009 DONE

## Out of scope

- Selection highlight state inside NQChart
- Multi-select legend
- Right-click menus

## Blueprint

[`plans/009-bi-interaction-api.md`](../../../../../plans/009-bi-interaction-api.md)

## Notes

SecoLab ST-289's primary blocker. Root-level handler (not per-series) because overlapping
marks make "which series" ambiguous if each `<Bar>` had its own click.
