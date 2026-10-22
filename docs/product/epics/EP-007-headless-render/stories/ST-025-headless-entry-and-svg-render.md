---
id: ST-025
epic: EP-007
title: "Headless entry and the SVG render"
status: done
priority: must
estimate: 5
owner: nqchart
plan: plans/018-headless-render.md
---

# ST-025 — Headless entry and the SVG render

As a Node consumer,
I want `@nqlib/nqchart/headless` to export the compilers, the theme registry and `renderToSvg`,
so that I draw a chart to an SVG string with no DOM.

## Acceptance criteria

- [x] The entry exists in `package.json` `exports`, `vite.lib.config.ts` and `tsconfig.lib.json`.
- [x] `renderToSvg(option, {width, height, modules})` returns a string that starts with `<svg`.
- [x] `printLegend(ctx, legendPart)` puts an ECharts legend in the option. A bar or an area
  series gets a block icon. A line series gets the line's own style.
- [x] `smoke-dist.mjs` renders one composed chart to SVG from the built `dist/headless.mjs`
  and from `dist/headless.cjs`.
- [x] `check-size` has a baseline for the entry.
- [x] `check-api` type-checks a headless call.
- [x] Verification gates from `docs/product/ai-contract.md` pass

## Out of scope

- An `SVGRenderer` registration in `echarts-init.ts`, or a `renderer` prop on a chart root
  (plan 016 Scope Out).
- PNG rasterisation. The consumer rasterises the SVG.
- The browser-side `renderToSVGString` export (EP-007 follow-up story).

## Blueprint

Technical how: [`plans/018-headless-render.md`](../../../../../plans/018-headless-render.md) (required for features).

## Notes

The consumer is secolab (plan page 2370). The print legend follows secolab SECO-1508: a
block for a bar or an area, and the line in its own style for a line.
