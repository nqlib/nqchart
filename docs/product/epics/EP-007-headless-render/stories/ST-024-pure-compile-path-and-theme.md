---
id: ST-024
epic: EP-007
title: "Pure compile path and the headless theme registry"
status: done
priority: must
estimate: 5
owner: nqchart
plan: plans/018-headless-render.md
---

# ST-024 — Pure compile path and the headless theme registry

As a Node consumer,
I want the compile path free of React and DOM reads, with a theme I register by chart id,
so that the option it builds equals the browser's for the same theme.

## Acceptance criteria

- [x] `echarts-tooltip.ts` imports no React module.
- [x] A theme registered with `withHeadlessTheme(chartId, theme, fn)` is read by every helper
  that reads `[data-chart]` today. Plan 018 lists the helpers.
- [x] A composed stacked bar rounds only its outer corners (the port of secolab PR #1387).
- [x] The bar, line, area and composed families register `MarkLineComponent` and
  `MarkAreaComponent`.
- [x] The vitest suite passes in the `node` environment.
- [x] Verification gates from `docs/product/ai-contract.md` pass

## Out of scope

- Optional peers for Node-only consumers (EP-007 follow-up story).
- The browser-side `renderToSVGString` export (EP-007 follow-up story).
- ECharts 6.x (EP-006).

## Blueprint

Technical how: [`plans/018-headless-render.md`](../../../../../plans/018-headless-render.md) (required for features).

## Notes

The consumer is secolab (plan page 2370, SECO-1470). Its pnpm patch
`@nqlib__nqchart@0.3.2.patch` holds the stacked-corner rule. secolab registers
`MarkLineComponent` itself (SECO-1289). Both workarounds leave secolab when 0.4.0 ships.
