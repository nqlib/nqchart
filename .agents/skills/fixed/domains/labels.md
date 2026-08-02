---
name: nqchart-fixed-domain-labels
description: >-
  Labels / leaders / axis text — truncated names, floating leader lines, clipped
  annotations. Read before chart-specific fix notes in this domain.
skill: nqchart-fixed
kind: domain
domain: labels
tags: labels, labelLine, leader, annotation, truncate, overflow, rose, pie
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: labels / leaders

Canvas text and leader lines for chart marks (pie/rose `labelLine`, axis labels, in-mark names).

## Layers

| Layer | Role |
|-------|------|
| `compile-*.ts` | Emits `label` / `labelLine` / axisLabel options |
| `chart-typography-tokens.ts` | Font size/weight roles for canvas text |
| `apply-chart-chrome.ts` | Themes label + labelLine colors |

## Fix notes

- [rose-leader-clip](../fixes/labels-rose-leader-clip.md) — rose leaders float / names truncate at 100% radius
- [radial-ring-orientation-clip](../fixes/labels-radial-ring-orientation-clip.md) — concentric ring names vertical/upside-down; semi/full polar clipped
- [gauge-axis-overlap](../fixes/labels-gauge-axis-overlap.md) — gauge tick labels overlap on small cards; viewport stride thins alternates
- [funnel-pipe-vertical-clip](../fixes/labels-funnel-pipe-vertical-clip.md) — vertical pipe stage names clipped at left canvas edge
