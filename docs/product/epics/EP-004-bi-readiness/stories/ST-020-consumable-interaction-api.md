---
id: ST-020
epic: EP-004
title: "Make interaction API consumable (typed props + check:api)"
status: done
priority: must
estimate: 2
owner: nqchart
plan: plans/014-make-the-interaction-api-consumable.md
---

# ST-020 — Make interaction API consumable

As a TypeScript consumer (SecoLab ST-289),
I want `onMarkClick` / `onBrushChange` / `onChartReady` / `chartRef` on line, area, and composed roots,
so that board cross-filter and drill work without casting or escape hatches.

## Acceptance criteria

- [x] `NQLineChartProps`, `NQAreaChartProps`, `NQComposedChartProps` extend `CartesianChartBaseProps`
- [x] `pnpm run check:api` fails if a documented interaction prop disappears from `dist/types`
- [x] `/bi-check` can bind handlers without type errors
- [x] Verification gates from `docs/product/ai-contract.md` pass

## Out of scope

- Funnel / radial / treemap mark-click
- Docs-truth CI lint (EP-005)

## Blueprint

[`plans/014-make-the-interaction-api-consumable.md`](../../../../plans/014-make-the-interaction-api-consumable.md)

## Notes

Runtime already forwarded the props; standalone props types locked consumers out. Regression class: standalone props silently drop inherited factory props. Closed with plan 014.
