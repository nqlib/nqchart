---
name: nqchart-fixed-hover-focus-custom-series-element-focus
description: >-
  Fixed: custom-series charts (rose pie, rounded / cone / pipe funnel, tile-column)
  never dimmed siblings on hover. ECharts reads focus/blurScope from the renderItem
  element, not series.emphasis. customFocusGroup / customFocusChild.
skill: nqchart-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-11"
tags: custom-series, renderItem, focus, blurScope, emphasisDisabled, hover, blur
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: custom series — hover never dims siblings

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-11, plan 020 Phase A)  
**Verify:** `/docs/pie-chart/static#rose` — hover a slice: every other slice fades to 0.2, the
hovered slice keeps its color; move off: all back to 1. Same on any rounded / cone / pipe funnel
and tile-column.

## Symptoms

- Tooltip shows on hover, but **no sibling dims** on any `type: "custom"` chart.
- Series-level `emphasis.focus: "self"` + `blur.itemStyle.opacity` look correct in the compiled
  option and in unit tests, so the bug is invisible without a browser.

## Root cause

ECharts' custom view wires hover focus **per returned element**:
`CustomView.createOrUpdateItem` → `toggleHoverEmphasis(el, elOption.focus, elOption.blurScope,
elOption.emphasisDisabled)`. The series-level `emphasis.focus` from `itemFocus()` is ignored for
custom series, so the element never triggers a blur of its siblings. Children with literal styles
also need their own `blur` state to fade.

## Fix (do not revert)

| File | Change |
|------|--------|
| `emphasis-presets.ts` | `customFocusGroup(enabled)` → `{ focus: "self", blurScope: "series" }` (or `{ emphasisDisabled: true }`); `customFocusChild(enabled)` → `{ blur: { style: { opacity: FOCUS.dim } }, emphasis: { style: { fill: "inherit" } } }` |
| `compile-pie.ts` (rose), `compile-funnel.ts` (pipe, rounded, cone), `compile-tile-column.ts` | Spread `customFocusGroup` on the group `renderItem` returns; spread `customFocusChild` on every child (paths **and** labels) |

Keep the series-level `itemFocus()` too — it carries the shared focus timing and the hover opt-out.

## Follow-up: hovered mark vanishes (2026-11)

With an empty emphasis style ECharts applies its default color lift
(`states.js` `createEmphasisDefaultState` → `liftColor(fill)`). `liftColor` only parses
plain color strings — a CSS-variable / `oklch(...)` fill lifts to nothing, so the hovered
radial-rose petal disappeared while its siblings dimmed correctly. `fill: "inherit"` keeps
the normal fill (and keeps the hovered mark unchanged, per the signature).

## Gotcha

Headless SSR (`renderToSVGString`) does **not** show blur after `dispatchAction("highlight")`,
even for native series — verify custom-series focus in the browser.
