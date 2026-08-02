---
name: nqchart-fixed-cartesian-stack-area-percent-empty
description: >-
  Fixed: percent area charts paint chrome but no series. compile-area set
  yAxis.max 100 without normalizeStackPercent (bar already did).
skill: nqchart-fixed
kind: fix
domain: cartesian-stack
status: fixed
fixed: "2026-08"
tags: area, percent, stackType, normalizeStackPercent, yAxis.max, empty
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: area — percent stack empty while ticks stay at 20/40/60/80

**Domain:** [cartesian-stack](../domains/cartesian-stack.md)  
**Status:** fixed (2026-08)  
**Verify:** Area chart with `stackType="percent"` and raw series totals > 100 — bands fill 0–100; y ticks remain 20/40/60/80.

## Symptoms

- Axes, legend, brush paint; stacked area series invisible / off-scale.
- Same data/config works for default and `"stacked"`; only `"percent"` fails.
- Docs may say “expanded”; engine API is `stackType: "percent"`.

## Root cause

`compile-area.ts` set `stack` + `yAxis.max: 100` for percent but mapped **raw** `ctx.data` into series. Bar used `normalizeStackPercent`; area did not. Stacked totals ≫ 100 sit above the axis max → empty plot.

## Fix (do not revert)

| File | Change |
|------|--------|
| `stack-percent.ts` | Shared `normalizeStackPercent` (extracted from bar). |
| `compile-area.ts` | When `stackType === "percent"`, normalize area keys before series `data`. |
| `compile-bar.ts` | Import shared helper (behavior unchanged). |

## Wrong fixes (rejected)

- **Lower / remove `yAxis.max`** — percent layout must be 0–100 share-of-total.
- **Showcase / docs-only rename** — engine gap was missing normalization, not naming.

## Regression check

```bash
pnpm exec vitest run src/registry/echarts-core/__tests__/compile-area.test.ts src/registry/echarts-core/__tests__/compile-bar.test.ts
```
