# Plan 021 — Analyst charts: KPI card, Sankey, variance, cohort, forecast, slope, small multiples

- **Status:** DONE 2026-11-07 — approved by owner the same day ("go do everything on high value")
- **Written:** 2026-11-07
- **Effort:** L · **Risk:** med (one new ECharts family; the rest compose existing charts)
- **Skills:** `nqchart-dev` / `nqchart-docs`
- **Builds on:** [plan 020](020-chart-signature-design-system.md) — every new chart uses the
  signature tokens (`chart-signature.ts`) and the unified focus mode from day one.

## Why

A business-analyst gap review (2026-11-07) found the library covers the classic families well
(including Pareto, histogram, box plot, bullet, waterfall, funnels) but misses the charts analysts
reach for weekly to explain **status, flow, change and comparison**. Gantt / timeline are out —
the owner's `nqgantt` covers them.

## Scope — In

| Item | Shape | Owner files (new unless noted) |
|------|-------|-------------------------------|
| **KPI card** | `NQKpiCard`: value, label, delta vs comparison period (direction-aware good/bad), optional target progress, optional sparkline | `charts/kpi-card.tsx`, example, docs page |
| **Small multiples** | `NQSmallMultiples`: one chart per facet in a responsive grid, shared y-domain + one legend | `charts/small-multiples.tsx`, example, docs page |
| **Sankey** | `NQSankeyChart`: nodes + links, signature node radius / gap, link focus (hover a node → its flows stay, rest dim) | `compile-sankey.ts`, `charts/sankey-chart.tsx`, registry + docs + headless |
| **Variance (IBCS)** | Actual vs plan per category: signed Δ bars (good/bad colours by `higherIsBetter`), optional Δ% labels | recipe in `chart-recipes.ts` on bar / composed |
| **Cohort retention** | Triangle of % retained per cohort × period | recipe on heatmap (`prepareCohortCells`) |
| **Forecast band** | Actuals solid, forecast dashed, confidence band shaded, "today" reference line | recipe on line / composed + RangeArea |
| **Slope / dumbbell** | Two values per category joined by a connector (before → after) | recipe on composed |

## Scope — Out

- Gantt / timeline (`nqgantt`), maps, Marimekko, sunburst, candlestick (later plans).

## Approach

- New components follow the compound-root pattern (`NQ*Chart` + parts), the signature tokens,
  `hoverFocus` opt-out, a11y table where data is tabular, loading / empty / error states.
- Recipes are pure data helpers in `chart-recipes.ts` + an example + a section on the
  `chart-recipes` docs page; compiler changes only if a recipe needs a missing primitive.
- Parallel subagents by file ownership; the parent runs `registry:build`, the browser pass and
  the gates once all land.

## Acceptance

- [x] Each item has an example in the registry and a docs preview
- [x] Sankey: compile tests, headless render, adjacency hover focus verified in the browser
- [x] KPI card + small multiples: light / dark checked in the browser; loading / empty states unit-tested (not browser-checked)
- [x] Recipes: unit tests for each `prepare*` helper; all four previews checked in dark mode
- [x] Verification gates pass (tests, tsc, eslint, audit:previews, registry-boundary, skill:validate, check:size with a new baseline)
- [x] Consumer skill updated (`pnpm sync:skills`)

## Notes from integration

- Composed gained `<Connector>` and `<Line variant="dots">` for the dumbbell.
- Bar / composed value labels now sit at the bar's outer end (below / left for negatives),
  skip missing points (a stacked `null` printed "0" on top of its neighbour), and carry an explicit
  theme color — ECharts' automatic white outside-stroke smudged them on dark cards.
- Size baseline rewritten: pie +6% and radial +5.5% from plan 020's custom-series geometry; new
  entries for kpi-card, small-multiples, sankey-chart.
- Not browser-checked: small-multiples per-facet hover, KPI card at ~160px, Sankey in dark mode.
