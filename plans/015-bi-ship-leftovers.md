# Plan 015 — BI ship leftovers (waterfall, funnel, harness, series id)

- **Status:** DONE
- **Written:** 2026-08-11
- **Effort:** M · **Risk:** low
- **Skills:** `nqchart-dev` / `nqchart-docs`

## Why

EP-004 / 009–014 left a few consumable gaps that block calling 0.3.0 “fully BI”:
scatter keyboard (S4.4), waterfall interaction + states, funnel mark-click,
stable series `id`, Phase 3 `/bi-check` coverage, and line/area docs for the
new props. SecoLab Phase 4 stays out of repo.

## Scope — In

- Scatter `useKeyboardMarkNav`
- Waterfall: `onMarkClick`, `chartRef`, empty/error/a11y + keyboard
- Funnel: same interaction + states pattern as pie
- Cartesian / composed / area series `id: dataKey`; mark mapper prefers `seriesId`
- `/bi-check` cases 6, 11, 12, 14, 17
- Line/area MDX ApiRows; `chart-handle` unit test; `check:api` waterfall/funnel

## Scope — Out

- SecoLab Phase 4
- Docs-truth CI (EP-005)
- Radar / radial / treemap / sparkline mark-click
- Multi-select legend

## Approach

Reuse `useChartInteraction` + `useKeyboardMarkNav` + plot-shell plates.
Waterfall embeds `__nq_seriesKey` / `__nq_datum` on value bars; ignore
`__wf_placeholder__`. Funnel mirrors pie (`nameKey` = stageKey).

## Acceptance

- [x] Scatter keyboard Enter fires `NQMarkEvent`
- [x] Waterfall + funnel accept `onMarkClick` / `chartRef` / empty-error-a11y
- [x] Series clicks resolve `seriesKey` from `id` when present
- [x] `/bi-check` covers line, yAxisId fallback, log, Area, keyboard checklist
- [x] Verification gates for touched surfaces (`tsc` + echarts-core vitest)
- [x] Specs S2.1 updated for waterfall/funnel

## Out of scope / follow-ups

- Specialty-root a11y plates without mark-click (radar/radial/treemap)
- Consumer skill sync only if prose drifts (runtime already documented)

**Closed:** 2026-08-11
