---
name: nqchart-fixed-domain-reference-marks
description: >-
  Reference lines and bands that fail to draw, share one axis, or fall outside
  the plot. Read before changing reference-marks.ts or MarkLine registration.
skill: nqchart-fixed
kind: domain
domain: reference-marks
tags: ReferenceLine, ReferenceBand, markLine, markArea, yAxisId, includeInDomain
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: reference marks

`ReferenceLine` / `ReferenceBand` compile to ECharts `markLine` / `markArea` on a silent series.

## Contract

- Core registration includes `MarkLineComponent` and `MarkAreaComponent`.
- One silent series per resolved y-axis, id `<chartId>-ref-<axisIndex>`.
- No `yAxisId` → axis 0. Unknown id → axis 0 plus a development warning.
- `includeInDomain` (default true) extends an automatic axis. A caller-set `min` or `max` stays.

## Fix notes

- [unregistered, single axis, clipped](../fixes/reference-marks-unregistered-single-axis.md)
