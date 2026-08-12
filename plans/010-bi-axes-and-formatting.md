# Plan 010 — BI axes: tick formatters, dual axis everywhere, scale types

- **Status:** DONE
- **Written:** 2026-08-11
- **Effort:** M · **Risk:** low
- **Skills:** `nqchart-dev` / `nqchart-docs`

## Why

BI numbers carry units. A cost axis reads `$1.2M`, a rate axis reads `94%`, a duration axis
reads `18 d` — and the same chart often carries two of them at once. NQChart 0.2.2 can put a
second axis on a composed chart, but it cannot format either axis's ticks, and no other
cartesian root can have a second axis at all.

Three concrete gaps, all found while a consumer was attempting a migration:

| Gap | Today | Consequence |
|---|---|---|
| No tick formatter | `YAxis` takes `yAxisId orientation domain unit` — no `tickFormatter` | axis ticks cannot show currency, percent, or a locale-aware compact number |
| Dual axis is composed-only | `NQAreaChart`'s `YAxis` takes **no props at all**; bar/line roots have no `orientation` | an area or bar chart cannot carry two units |
| `yAxisId` is nested | `barProps={{ yAxisId }}` / `lineProps={{ yAxisId }}` | inconsistent with `XAxis`/`YAxis`, and the composed-chart API doc shows the flat form the package does not ship |

The last row is also a docs-truth problem: the published `.d.ts` and the docs disagree, and
the doc is what an agent reads first. A consumer following the documentation wrote code that
did not type-check.

`secolab` shipped per-axis tick formatting on recharts in its ST-284. A like-for-like
migration to NQChart today would **lose** that capability — which is a strong reason to close
this gap before asking anyone to migrate.

## Scope — In

**1. `tickFormatter` on `XAxis` and `YAxis`, every cartesian root.**

```ts
tickFormatter?: (value: unknown, index: number) => string;
```

`XAxis` already has one; `YAxis` does not. Make the two symmetrical.

**2. Dual axis on every cartesian root**, not just composed. `NQAreaChart`, `NQBarChart`,
`NQLineChart` and `NQScatterChart` gain the same `<YAxis yAxisId orientation domain unit />`
that composed already has, and their series accept an axis binding.

**3. Flatten `yAxisId`.** Accept `yAxisId` directly on `<Bar>`, `<Line>`, `<Area>` and
`<Scatter>`. Keep `barProps`/`lineProps` working for one minor version, mark deprecated in
the types, then drop. Update the composed-chart doc in the same PR — the doc currently
describes the flat form as if it shipped.

**4. Scale types.**

```ts
type NQScale = "linear" | "log" | "time" | "category";
scale?: NQScale;      // on XAxis / YAxis
reversed?: boolean;   // on either
```

Log scale is the one BI reaches for constantly (spend distributions, defect counts) and
ECharts supports natively — this is a pass-through, not construction.

**5. Axis label handling for dense categories.** `labelRotate?: number` and
`labelInterval?: number | "auto"`, so forty months on an x-axis degrade legibly rather than
overlapping.

## Scope — Out

- Automatic unit inference or conversion. The caller declares the format; NQChart never
  converts USD to VND or hours to days.
- More than two Y axes. Two is the readable limit; a third is a sign the chart should split.
- Axis breaks (discontinuous scales). Rarely defensible, easy to mislead with.

## Approach

- Axis compilers already map to ECharts `xAxis`/`yAxis` option objects; `tickFormatter`
  becomes `axisLabel.formatter`, `scale` becomes `type`, `reversed` becomes `inverse`,
  `labelRotate` becomes `axisLabel.rotate`. Mostly pass-through with type narrowing.
- Dual-axis generalisation: lift the composed root's axis-index resolution into shared
  cartesian core, so `yAxisId="right"` resolves to index 1 **only when a second `<YAxis />`
  exists** and falls back to 0 otherwise. That safe-default behaviour already exists in
  `compile-composed.ts`; the work is moving it, not inventing it.
- Deprecation: keep `barProps`/`lineProps` accepted, emit a dev-only console warning once
  per key, and mark `@deprecated` in the `.d.ts` so editors surface it.

## Acceptance

- [ ] `YAxis` accepts `tickFormatter` on every cartesian root; ticks render formatted.
- [ ] A second `<YAxis orientation="right" />` works on area, bar, line and scatter roots.
- [ ] Each axis formats from its own `tickFormatter`, independently.
- [ ] `yAxisId` is accepted directly on `<Bar>`, `<Line>`, `<Area>`, `<Scatter>`;
      `barProps`/`lineProps` still work and are marked deprecated.
- [ ] `scale="log"` and `reversed` work on both axes.
- [ ] `labelRotate` / `labelInterval` keep forty categories legible.
- [ ] The composed-chart doc matches the shipped signature — **verified by reading
      `dist/types/`, not the source**, since that is what a consumer installs.
- [ ] Verification gates from `docs/product/ai-contract.md` pass for touched surfaces
- [ ] Consumer skill updated (`pnpm sync:skills`)
- [ ] Bug? → `.agents/skills/fixed/` note if non-trivial regression risk

## Out of scope / follow-ups

- A repo check that the published `.d.ts` and the docs agree — the drift this plan fixes by
  hand will recur. Worth a lint step; see plan 012's follow-ups.
