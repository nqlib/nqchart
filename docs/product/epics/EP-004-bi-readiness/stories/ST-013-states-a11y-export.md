---
id: ST-013
epic: EP-004
title: "Empty/error, a11y table, keyboard, export"
status: done
priority: should
estimate: 5
owner: nqchart
plan: plans/012-bi-states-a11y-export.md
---

# ST-013 — Empty/error, a11y table, keyboard, export

As a production dashboard,
I want empty and error to read as different messages, a screen-reader path to the numbers,
keyboard reachability for marks, and PNG/SVG export,
so that a canvas chart is operable outside mouse + sighted demo conditions.

## Acceptance criteria

- [x] Distinct empty vs error plates; overridable `emptyState` / `isEmpty`
- [x] Default visually hidden a11y table (row-capped); canvas `aria-hidden` when present
- [x] Keyboard nav when `onMarkClick` bound; Enter fires same event; tooltip follows focus
- [x] `chartRef.toDataURL` with themed background
- [x] Reduced-motion respected (pre-existing animation gate)
- [x] Plan 012 DONE

## Out of scope

- Server-side rendering to images
- CSV/XLSX export
- Full ARIA grid pattern

## Blueprint

[`plans/012-bi-states-a11y-export.md`](../../../../../plans/012-bi-states-a11y-export.md)

## Dependencies

ST-010 (shared mark-event helper for keyboard Enter).
