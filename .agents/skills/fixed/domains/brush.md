---
name: nqchart-fixed-domain-brush
description: >-
  Footer NQChartBrush / category zoom — handle anchoring, plot alignment,
  range framing. Read before brush UX fix notes.
skill: nqchart-fixed
kind: domain
domain: brush
tags: brush, slider, dataZoom, NQChartBrush, category, boundaryGap, handles
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: brush / category slider

Footer `NQChartBrush` (and related category zoom) that filters cartesian rows by inclusive index range.

## Layers

| Layer | Role |
|-------|------|
| `chart-grid.ts` | `indexToPlotPercent`, `extractCategoryBoundaryGap`, plot insets |
| `nq-chart-brush.tsx` | Handle / overlay UI + drag → index commit |
| `use-chart-brush.ts` | Inclusive `data.slice(start, end+1)` filter |
| `create-cartesian-chart.tsx` | Mounts brush under chart roots |

## Contract

- Range is **inclusive** category indices.
- With `boundaryGap` (bar bands): left handle = band **start**, right = band **end** — window frames whole groups.
- Without `boundaryGap` (line/area points): handles sit on category points.

## Fix notes

- [band-edge-handles](../fixes/brush-band-edge-handles.md) — handles used to split mid-group
