---
id: ST-023
epic: EP-003
title: "hoverFocus opt-out on every chart root"
status: review
priority: should
estimate: 3
owner: nqchart
plan: plans/017-hover-focus-opt-out.md
---

# ST-023 — hoverFocus opt-out on every chart root

As a host app (ledger / KPI blocks),
I want `hoverFocus={false}` on every `NQ*Chart` root,
so that hover still shows the tooltip without dimming sibling marks — without changing the default for existing consumers.

## Acceptance criteria

- [x] Every chart root accepts `hoverFocus?: boolean` (default `true` / omit = today’s dim)
- [x] `hoverFocus={false}` compiles `emphasis.disabled` instead of the focus preset; pie/funnel/scatter/treemap/waterfall/radial skip runtime repair
- [x] Tooltip, legend isolate (`isClickable`), and brush are unchanged
- [x] Sparkline and single-arc gauge stay tooltip-only either way
- [x] Compile tests cover area (index), pie (item), radial (series)
- [x] Hover-focus doc + consumer skill document the opt-out
- [x] Verification gates from `docs/product/ai-contract.md` pass

## Out of scope

- Changing the hover-focus contract or default
- Publishing `@nqlib/nqchart` (separate release)
- `/charts/lab` cases (showcase `/charts` toolbar covers families)

## Blueprint

[`plans/017-hover-focus-opt-out.md`](../../../../../plans/017-hover-focus-opt-out.md)

## Notes

Showcase ledger (`WeeklyTrend`) and `/charts` Focus On/Off toolbar are the first consumers. Do not infer off from `emphasis.disabled` — pie/funnel/waterfall/radial already set that and still dim via repair.

## Bugs

- 2026-08-16 — Focus Off then On left cartesian dim off until remount. ECharts `setOption` merge kept `emphasis.disabled: true` because the on-preset omitted the key. Native-emphasis presets now set `disabled: false`.
