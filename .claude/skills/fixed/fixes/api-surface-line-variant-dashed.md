---
name: nqchart-fixed-api-surface-line-variant-dashed
description: >-
  Fixed: Line had no working dashed stroke. Compilers set lineStyle.color only;
  standalone Line lacked variant; composed Line was typed "points" only.
skill: nqchart-fixed
kind: fix
domain: api-surface
status: fixed
fixed: "2026-08"
tags: Line, variant, dashed, lineStyle, compile-line, compile-composed, rolling mean
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: Line variant dashed does not dash

**Domain:** [api-surface](../domains/api-surface.md)  
**Status:** fixed (2026-08)  
**Verify:** `pnpm test` (`compile-line`, `compile-composed`, `compile-area`); `check:api` probe `<Line variant="dashed" />`; lab `composition.dashed-line`.

## Symptoms

- A rolling mean in the parent series colour cannot be told apart from the parent.
- `<Line variant="dashed">` is a type error on standalone Line; composed Line only typed `"points"`.
- Docs listed a non-existent `strokeVariant` on Line.

## Root cause

`compile-line.ts` / `compile-composed.ts` emitted `lineStyle: { color }` with no `type`.
Area already dashed when `variant` included `"dashed"` (`dashed-stroke`). Line did not
share that mapping, and the public prop was missing or too narrow.

## Fix (do not revert)

| File | Change |
|------|--------|
| `cartesian-series.ts` | `lineStyleType(variant)` — `points`/`solid` → solid; includes `dashed` / `dotted` |
| `compile-line.ts`, `compile-composed.ts`, `compile-area.ts` | `lineStyle.type: lineStyleType(...)` |
| `line-chart.tsx` / `composed-chart.tsx` | `variant?: "solid" \| "dashed" \| "dotted"` (composed also `"points"`) |
| `scripts/check-api.mjs` | Probe dashed Line on line + composed |

`"points"` stays markers-only (box-plot medians), not a dash.

## Wrong fixes (rejected)

- Inventing `strokeVariant` to match stale docs — the Area fill `variant` and Line stroke share one prop name.
- Hardcoding `lineStyle.type: "dashed"` for every Line — consumers need solid by default.
