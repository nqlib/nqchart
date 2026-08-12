---
id: ST-011
epic: EP-004
title: "Tick formatters, dual axis, scale, flat yAxisId"
status: done
priority: must
estimate: 5
owner: nqchart
plan: plans/010-bi-axes-and-formatting.md
---

# ST-011 — Tick formatters, dual axis, scale, flat yAxisId

As a chart author,
I want per-axis tick formatters and a second Y axis on every cartesian root, with flat
`yAxisId` on series,
so that currency beside percent (and docs that already showed the flat form) actually
type-check and render.

## Acceptance criteria

- [x] `YAxis` / `XAxis` accept `tickFormatter`, `scale`, `reversed`, dense-label props
- [x] Dual Y on area, bar, line, scatter (not only composed)
- [x] Flat `yAxisId` on Bar/Line/Area/Scatter; nested `*Props` deprecated but accepted
- [x] Spec S3 in [[product/specs]]; plan 010 DONE

## Out of scope

- Automatic unit conversion
- More than two Y axes
- Axis breaks

## Blueprint

[`plans/010-bi-axes-and-formatting.md`](../../../../../plans/010-bi-axes-and-formatting.md)

## Notes

SecoLab ST-284 shipped per-axis formatting on recharts; migration parity required this story.
`scale="time"` is pass-through — consumers must feed real time values, not category strings.
