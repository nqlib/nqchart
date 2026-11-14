---
id: ST-028
epic: EP-003
title: "Waterfall direction colors, connectors, and horizontal layout"
status: done
priority: should
estimate: 5
owner: Wolfsonng
plan: plans/023-waterfall-direction-and-layout.md
---

# ST-028 — Waterfall direction colors, connectors, and horizontal layout

As an analyst who builds a bridge or a P&L chart,
I want each waterfall step to show if it goes up or down, and a horizontal layout,
so that a reader sees the direction and the size of each step without effort.

## Acceptance criteria

- [ ] Steps use increase, decrease, and total colors by default. `higherIsBetter={false}` swaps
      the increase and decrease colors.
- [ ] `connectors` draws lines from each column to the next at the running total. The
      lines are off by default.
- [ ] Steps show signed labels at their moving end.
- [ ] `layout="horizontal"` draws the steps from top to bottom.
- [ ] A running total below zero draws the correct columns.
- [ ] Verification gates from `docs/product/ai-contract.md` pass

## Out of scope

- An arrow-end variant.
- A grow-from-previous-step animation.

## Blueprint

Technical how: [`plans/023-waterfall-direction-and-layout.md`](../../../../../plans/023-waterfall-direction-and-layout.md).

## Notes

The 0.5 waterfall colors each column by category. The default changes to direction colors.
`colorBy="category"` keeps the old look.
