---
id: ST-012
epic: EP-004
title: "Reference lines/bands and Area in composed"
status: done
priority: must
estimate: 5
owner: nqchart
plan: plans/011-bi-annotations-and-marks.md
---

# ST-012 — Reference lines/bands and Area in composed

As a chart reader,
I want thresholds and tolerance bands drawn in data space, and areas inside composed
charts,
so that budget-vs-actual and SLA charts answer the comparison question without holding
the number in my head.

## Acceptance criteria

- [x] `<ReferenceLine>` / `<ReferenceBand>` on cartesian roots; semantic `tone`
- [x] Excluded from legend and `onMarkClick`
- [x] `<Area>` in `NQComposedChart` with `stackId` / `yAxisId`
- [x] `showLabels` / `labelFormatter` on bar, line, area
- [x] Example budget-cap preview; plan 011 DONE

## Out of scope

- Pixel-anchored free annotations
- Trend / regression recipes
- Draggable thresholds

## Blueprint

[`plans/011-bi-annotations-and-marks.md`](../../../../../plans/011-bi-annotations-and-marks.md)

## Dependencies

ST-011 (shared axis-binding helper).
