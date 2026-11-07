---
id: ST-027
epic: EP-003
title: "Chart signature — one shape language, one focus mode, rose pie"
status: in-progress
priority: should
estimate: 13
owner: nqchart
plan: plans/020-chart-signature-design-system.md
---

# ST-027 — Chart signature

As a product team shipping several NQChart families on one dashboard,
I want every chart to share the same corners, gaps, strokes and hover-focus behaviour,
so that the dashboard reads as one calm, Apple/Linear-grade system instead of a mix of styles —
and I want a rounded rose pie built on that same language.

## Acceptance criteria

- [ ] One signature token module (radius mark/surface/join, seam/stage gap, strokes, symbols, glow) drives every compiler; themable via `--radius` and `--chart-gap`
- [ ] Hover, legend isolate and keyboard focus look identical on every family: siblings + labels at 0.2, hovered mark unchanged
- [ ] `hoverFocus={false}` turns off every dimming path
- [ ] `<Pie rose>` renders a rose pie: angle and radius ∝ value, rounded slices, hairline pad, small hole, descending clockwise from 12 o'clock
- [ ] Signature docs page + gallery baseline (light/dark) committed; consumer skill updated
- [ ] Released as 0.5.0 with a migration note for the visual change
