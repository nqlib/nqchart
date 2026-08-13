---
id: ST-022
epic: EP-005
title: "Per-family ECharts payload + export/internals guards"
status: review
priority: must
estimate: 5
owner: nqchart
plan: plans/016-echarts-payload.md
---

# ST-022 — Per-family ECharts payload

As a consumer who imports one chart family (SecoLab ST-289, Tauri binary),
I want that entry to register only the ECharts modules it draws,
so that I do not pay the whole library for a bar chart.

## Acceptance criteria

- [x] `@nqlib/nqchart/bar-chart` ≤ 200 KB gzip (esbuild minify + gzip, echarts included)
- [x] `pnpm run check:size` fails when a family entry grows more than 5%
- [x] `ChartExportOpts.type` is `"png"` only (canvas renderer cannot emit SVG)
- [x] `pnpm run check:internals` fails if a private `echarts/lib/...` import moves
- [x] `check:api` stays green; Line/Area `variant="dashed"` is an additive public prop (probe covers it)
- [x] `<Line variant="dashed">` (standalone + composed) compiles `lineStyle.type: "dashed"`; Area `variant="dashed"` / `"dashed-stroke"` does the same
- [x] Pie a11y table keys off the value column, not slice names in `config`
- [x] Verification gates from `docs/product/ai-contract.md` pass

## Out of scope

- SVG renderer / root `renderer` prop
- Publishing 0.3.1 (owner publishes)
- ECharts 6.x (EP-006)

## Blueprint

[`plans/016-echarts-payload.md`](../../../../plans/016-echarts-payload.md)

## Notes

Verified against published `@nqlib/nqchart@0.3.0`: bar-chart 333 KB gzip vs
hand-picked echarts bar 175 KB. Registration must stay inside a called
function (`sideEffects: false`).

## Bugs

- **2026-08-12** — Pie sr-only table was a grid of blanks: `deriveSeriesKeysFromConfig` used `Object.keys(config)` (slice names) against rows `{ name, value }`. Fixed with `derivePieSeriesKeys`. Funnel may share the pattern; not in this story.
- **2026-08-12** — `<Line variant="dashed">` did not dash: compilers set `lineStyle: { color }` only; standalone Line had no `variant`; composed Line was typed `"points"` only. `lineStyleType()` now maps dashed/dotted.
- **2026-08-12** — Composed `<Area />` + `<Line />` on the same dataKey threw `id duplicates` at `setOption` and emitted two React legend keys. `uniquifySeriesIds` suffixes the second series; `uniqueLegendSeriesKeys` keeps one legend row.
