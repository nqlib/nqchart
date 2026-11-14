---
name: nqchart-fixed-cartesian-stack-waterfall-negative-running-total
description: >-
  Fixed: a waterfall step that crosses zero was drawn from zero. The placeholder +
  values stack used ECharts' default samesign stacking. stackStrategy "all" fixes it.
skill: nqchart-fixed
kind: fix
domain: cartesian-stack
status: fixed
fixed: "2026-11"
tags: waterfall, stackStrategy, samesign, negative, running-total, placeholder
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: waterfall step that crosses zero is drawn from zero

**Domain:** [cartesian-stack](../domains/cartesian-stack.md)  
**Status:** fixed (2026-11)  
**Verify:** `pnpm test` (`compile-waterfall.test.ts`, "stacks across signs").

## Symptoms

- Rows `start 10`, `−30`: the second column is drawn from 0 to 30. The correct column goes from 10 down to −20.
- Any step that starts or ends below zero is in the wrong place.

## Root cause

The waterfall draws each step as a transparent placeholder bar plus a values bar in one
stack. The placeholder is the lower end of the step and can be negative. ECharts 5 stacks
with `stackStrategy: "samesign"` by default: a positive value stacks only on positive
values. The values bar ignored the negative placeholder and started at zero.

## Fix (do not revert)

| File | Change |
|------|--------|
| `echarts-core/compile-waterfall.ts` | `stackStrategy: "all"` on the placeholder and the values series |
| `echarts-core/waterfall-steps.ts` | `buildWaterfallSteps` gives each step its start and end; the placeholder is `min(start, end)` |

## Wrong fixes (rejected)

- Splitting a step that crosses zero into a positive and a negative segment. It works, but
  it doubles the marks, and hover, labels, and corners then need two segments per step.
