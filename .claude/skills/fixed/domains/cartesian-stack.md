---
name: nqchart-fixed-domain-cartesian-stack
description: >-
  Cartesian stacked / percent layouts — empty plots, off-scale series, missing
  0–100 normalization. Read before chart-specific stack fix notes.
skill: nqchart-fixed
kind: domain
domain: cartesian-stack
tags: stack, percent, stacked, yAxis, normalize, area, bar
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: cartesian stack / percent

`cartesian.stackType` of `"stacked"` | `"percent"` on bar/area (and similar) compilers.

## Layers

| Layer | Role |
|-------|------|
| `stack-percent.ts` | Shared `normalizeStackPercent` — row values → 0–100 |
| `compile-bar.ts` / `compile-area.ts` | Stack id + `yAxis.max: 100` for percent |
| Chart roots | Pass `stackType` via cartesian context |

## Contract

- `"stacked"` — raw values, stack series, auto y scale
- `"percent"` — **must** normalize keys to share of row total × 100, then `yAxis.max: 100`

Setting `max: 100` without normalization leaves raw totals (often ≫ 100) off-scale — chrome paints, series look empty.

## Fix notes

- [area-percent-empty](../fixes/cartesian-stack-area-percent-empty.md) — percent area sets max 100 but skipped normalize
