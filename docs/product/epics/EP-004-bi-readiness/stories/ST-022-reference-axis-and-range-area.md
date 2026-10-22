---
id: ST-022
epic: EP-004
title: "Reference marks per axis, open bands, RangeArea"
status: done
priority: must
estimate: 3
owner: nqchart
plan: plans/019-reference-marks-and-range-area.md
---

# ST-022 — Reference marks per axis, open bands, RangeArea

As a chart reader,
I want a target on the right axis, a shade above a ceiling, and a moving
interval around a forecast,
so that a dual-axis plan chart shows each mark on the scale it belongs to.

## Acceptance criteria

- [ ] `ReferenceLine` draws in a fresh ECharts instance with no host registration
- [ ] Marks with different `yAxisId` values compile to separate series
- [ ] `includeInDomain` extends an automatic axis and leaves an explicit max alone
- [ ] `y: [100, null]` compiles to the axis max edge
- [ ] `RangeArea` gaps on null and stays out of the legend
- [ ] Demo and changelog 0.4.0

## Blueprint

[`plans/018-reference-marks-and-range-area.md`](../../../../../plans/018-reference-marks-and-range-area.md)
