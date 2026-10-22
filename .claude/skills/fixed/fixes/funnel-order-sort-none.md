---
name: nqchart-fixed-funnel-order-sort-none
description: >-
  Fixed: native funnel stages reordered when a later stage outgrew an earlier
  one. Default sort is now none; expose sort prop for ascending/descending.
skill: nqchart-fixed
kind: fix
domain: funnel-order
status: fixed
fixed: "2026-08"
tags: funnel, sort, none, descending, pipeline, stage-order
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: funnel stages jump when values cross

**Domain:** [funnel-order](../domains/funnel-order.md)  
**Status:** fixed (2026-08)  
**Verify:** Compile with inverted mid-stage values → series `sort: "none"` and `data` names match input order. Opt-in: `sort="descending"` still emits ECharts descending sort.

## Symptoms

- Pipeline funnel stages swap positions after a data refresh (e.g. On Deck outgrows Opportunities).
- Stage order no longer matches the consumer's `data` array.

## Root cause

`compile-funnel.ts` hardcoded ECharts `sort: "descending"`. Native funnel re-ranks stages by value on every update, so any mid-stage that grows past an earlier stage jumps upward in the chart.

## Fix (do not revert)

| File | Change |
|------|--------|
| `parts/types.ts` | `FunnelSort`; `sort?` on `FunnelStylePart` + `FunnelCompileConfig`. |
| `funnel-layout.ts` | Resolve `sort` (default `"none"`). |
| `compile-funnel.ts` | Pass resolved `sort` into native series (not pipe). |
| `funnel-chart.tsx` | Root + `<Stages />` `sort` prop; export `FunnelSort`. |
| `compile-funnel.test.ts` | Default `none` + inverted values; `sort="descending"` honor. |

## Wrong fixes (rejected)

- Leaving default `"descending"` and only documenting the prop — pipelines still break until every consumer opts into `"none"`.
- Sorting in app code before pass-through — fights ECharts if compile still forces descending.
