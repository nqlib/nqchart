# Plan 019 — Reference marks per axis, open bands, RangeArea

- **Status:** DONE
- **Written:** 2026-10-13
- **Effort:** M · **Risk:** med
- **Skills:** `nqchart-dev` / `nqchart-docs` / `fixed`

## Why

SecoLab pins `@nqlib/nqchart@0.3.2` and works around three reference-mark defects:
ECharts never draws `markLine` / `markArea` because those components are not
registered, every mark shares the first `yAxisId`, and a mark outside the data
range is clipped. 0.4.0 fixes those and adds an open band plus `RangeArea`.

## Scope — In

- Register `MarkLineComponent` and `MarkAreaComponent` on the core module list.
- One silent series per resolved axis: `<chartId>-ref-<axisIndex>`.
- `includeInDomain` (default `true`) extends an automatic axis with min/max functions.
- `ReferenceBand` `y: [number | null, number | null]`.
- `RangeArea` (`lowKey`, `highKey`, `yAxisId`, `tone`, `opacity`, `label`).
- Docs demo, changelog 0.4.0, consumer skill.

## Scope — Out

- Changing `variant`, `tone`, `label`, `labelPosition`.
- Overriding a caller-set axis `min` or `max`.
- Sparkline domain (it already pins min/max).

## Approach

`withReferenceMarks` groups marks, patches value axes, and appends range series
as a transparent stack base plus `high - low`. Annotation series stay out of
legend, tooltip, palette, and `onMarkClick`.

## Acceptance

- [x] Compiler tests and one SVG render test pass
- [x] Demo shows dual axis, open band, and `RangeArea` in light and dark
- [ ] 0.4.0 published (owner step; not on npm yet)
- [x] Consumer skill synced
- [x] Fixed note for the three defects

## Outcome

Lands on the unpublished 0.4.0 that also contains the headless entry (plan 018). Plan number is 019 because 018 is the headless plan. Bar corners are sign-aware in the same release: a negative bar rounds the end away from zero, and a stack rounds only the outer end of each sign.
