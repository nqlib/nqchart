---
id: EP-003
title: Chart craft — hover, motion, brush
status: done
target: 2026-Q3
owner: nqchart
---

# EP-003 — Chart craft — hover, motion, brush

## Goal

Charts that feel intentional: stable hover-focus across series types, shared motion tokens
aligned with nqui, and a brush footer that does not fight intro animations.

## Scope — In

- Hover-focus repair paths (scatter, treemap, funnel, waterfall, radial)
- `apply-chart-animation` + `prefers-reduced-motion`
- `NQChartBrush` / `useChartBrush` (internal → later public in EP-004)
- Funnel orient / pipe / sort (plans 007–008)
- `fixed/` skill for regression memory

## Scope — Out

- Public mark-click API (→ EP-004 / ST-010)
- Export / a11y table (→ EP-004 / ST-013)

## Stories (retrospective)

| ID | Title | Status | Plan |
|----|-------|--------|------|
| ST-009 | Funnel horizontal + pipe + sort | done | 007, 008 |

Hover/motion work landed as continuous craft + `fixed/` notes rather than numbered plans;
treat those fix notes as the story archive for regressions.

## Dependencies

EP-001.
