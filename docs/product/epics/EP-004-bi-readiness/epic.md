---
id: EP-004
title: BI readiness — interaction, axes, annotations, a11y
status: done
target: 2026-Q3
owner: nqchart
---

# EP-004 — BI readiness — interaction, axes, annotations, a11y

## Goal

Make NQChart a **BI renderer**, not only a picture library: mark click with modifiers,
legend selection plumbing, brush export, dual-axis + tick formatters everywhere,
reference lines/bands, empty/error states, screen-reader data table, keyboard access, and
PNG/SVG export.

## Why now

SecoLab Dashboards v2 attempted to migrate `chart-viz.tsx` onto `@nqlib/nqchart` 0.2.2 and
**stopped**. Two shipped features — board cross-filtering and drill-by — require
`onMarkClick`. The same check found missing tick formatters, dual-axis only on composed,
no `<Area>` in composed, and no reference marks. Their ST-289 records the blocker; this
epic is the upstream answer.

## What this epic turned out to be

Plans 009–012 shipped in one sweep on 2026-08-11; 014 made the props consumable; 013 is
acceptance; **015** closed leftovers (waterfall/funnel click, scatter keyboard, series `id`).
Most “interaction” work was **plumbing** (`useChartBrush`, legend `selected`) — only mark
click was new construction. Axes and annotations were mostly ECharts pass-through with a
compound face. States/a11y landed on the shared plot shell so every root inherits them.

## Scope — In

- Mark click, legend select, brush public API, `onChartReady` / `chartRef`
- Dual axis + formatters + scale on cartesian roots; flat `yAxisId`
- `ReferenceLine` / `ReferenceBand`; `<Area>` in composed; point labels
- Empty/error, a11y table, keyboard nav, export, reduced-motion (already gated)

## Scope — Out

- Cross-chart linking (consumer)
- Multi-select legend
- Server-side image render / CSV export
- Docs-truth CI lint (→ EP-005)
- ECharts 6 (→ EP-006)

## Stories

| ID | Title | Status | Plan |
|----|-------|--------|------|
| [ST-010](stories/ST-010-mark-click-and-brush.md) | Mark click, legend select, brush, escape hatch | done | [009](../../../../plans/009-bi-interaction-api.md) |
| [ST-011](stories/ST-011-axes-and-formatting.md) | Tick formatters, dual axis, scale, flat yAxisId | done | [010](../../../../plans/010-bi-axes-and-formatting.md) |
| [ST-012](stories/ST-012-reference-marks-and-composed-area.md) | Reference lines/bands + Area in composed | done | [011](../../../../plans/011-bi-annotations-and-marks.md) |
| [ST-013](stories/ST-013-states-a11y-export.md) | Empty/error, a11y table, keyboard, export | done | [012](../../../../plans/012-bi-states-a11y-export.md) |
| [ST-020](stories/ST-020-consumable-interaction-api.md) | Consumable typed props + `check:api` | done | [014](../../../../plans/014-make-the-interaction-api-consumable.md) |
| [ST-021](stories/ST-021-bi-acceptance.md) | Acceptance vs dist + `/bi-check` + 0.3.0 prep | done | [013](../../../../plans/013-bi-readiness-acceptance-test-plan.md) |

Leftovers (waterfall/funnel/scatter keyboard/series id): [015](../../../../plans/015-bi-ship-leftovers.md) (DONE). Phase 4 SecoLab smoke remains a consumer follow-up.

## Success metrics

- SecoLab ST-289 unblocked: mark-click + axis parity available on a **0.3.0** build (`check:api` green). Phase 4 SecoLab smoke is the consumer follow-up.
- Specs S2–S4 in [[product/specs]] hold under `pnpm test` + typecheck.
- Example `ex-mark-click-budget-chart` demonstrates cross-filter + budget cap.

## Dependencies

- EP-001 (compound + compile)
- EP-003 (brush internals, motion)

## Consumer link

SecoLab: `docs/product/epics/EP-036-multi-dataset-charts/stories/ST-289-nqchart-renderer-migration.md`
