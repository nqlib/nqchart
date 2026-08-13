---
id: ST-022
epic: EP-005
title: "Per-family ECharts payload + export/internals guards"
status: done
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
- [x] `check:api` stays green; no public prop changes
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
