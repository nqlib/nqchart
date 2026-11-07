---
name: nqchart-fixed-domain-bar-radius
description: >-
  Cartesian bar corner radius — which end is rounded, including negative values
  and same-sign stacks. Read before bar-radius fix notes.
skill: nqchart-fixed
kind: domain
domain: bar-radius
tags: bar, radius, borderRadius, stack, negative, composed
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: bar corner radius

`itemStyle.borderRadius` on cartesian bar series in `compile-bar.ts` and `compile-composed.ts`.

## Layers

| Layer | Role |
|-------|------|
| `bar-radius.ts` | Sign-aware radius and same-sign stack roles |
| `compile-bar.ts` | Per-datum radius, including horizontal layout |
| `compile-composed.ts` | Per-datum radius for composed `<Bar>` |

## Contract

- A value above zero rounds the end away from zero (top, or the right end when horizontal).
- A value below zero rounds the opposite end. Zero has no radius.
- In a stack, the positive segments and the negative segments are separate. Corners on the zero line are **always square**.
- Since plan 020 (2026-11): the outermost non-zero segment of each sign rounds its outer end with `radius.mark`; every corner that faces a seam between two segments rounds with `radius.join` (`resolveBarJoinRadius`). Stack roles: `only`, `baseTop`, `baseBottom`, `middle`, `top`, `bottom`.
- Stack seams (`stackSegmentGapStyle`) are a zero-blur `shadowColor` in the canvas background, offset one `gap.seam` toward zero — painted on the end of the segment below only. **Not** `borderWidth`: a centered border shrinks every bar ~4px at the zero line and trims outer ends. Segments on the zero line and lone segments get no shadow.
- Radius source is the signature (`resolveChartSignature(...).radius.mark`); `barRadius` and part `radius` override it everywhere, including waterfall.

## Fix notes

- [sign-aware corners](../fixes/bar-radius-sign-aware.md) — negative bars and mixed stacks were rounded on the zero line
