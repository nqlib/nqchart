# Plan 011 — Reference lines, bands, and `<Area>` in composed charts

- **Status:** DONE
- **Written:** 2026-08-11
- **Effort:** M · **Risk:** low
- **Skills:** `nqchart-dev` / `nqchart-docs`

## Why

Half of BI is comparison against a threshold. Budget against a cap, cycle time against an
SLA, yield against a floor, actuals against a target. Without a reference line the reader
has to hold the threshold in their head while scanning the bars, and the chart stops
answering the only question that mattered.

NQChart has no way to draw one. ECharts supports `markLine` and `markArea` natively, so this
is a pass-through with a compound-component face, not new rendering work.

The same plan closes a composition gap found by a consumer: `NQComposedChart` accepts
`<Bar>` and `<Line>` but **no `<Area>`**, so a shaded band cannot join a mixed-mark chart —
which is exactly how a plan-versus-actual chart usually wants to draw its tolerance band.

## Scope — In

**1. `<ReferenceLine>`** as a child of any cartesian root.

```tsx
<ReferenceLine
  y={budgetCap}                 // or x={"2026-06"} for a vertical marker
  yAxisId="left"
  label="Budget cap"
  labelPosition="end"           // start | middle | end
  variant="dashed"              // solid | dashed | dotted
  tone="warning"                // neutral | accent | positive | warning | critical
/>
```

`tone` maps to the same semantic tokens the rest of the library reads, so a threshold looks
like a threshold in both themes without the caller passing a hex.

**2. `<ReferenceBand>`** for a range — a tolerance envelope, a target zone, a shaded
recession period.

```tsx
<ReferenceBand y={[lower, upper]} tone="positive" opacity={0.1} label="In tolerance" />
<ReferenceBand x={["2026-03", "2026-05"]} tone="neutral" label="Shutdown" />
```

**3. `<Area>` inside `NQComposedChart`,** so bars, lines and areas compose. Reuse the area
compiler already used by `NQAreaChart`; the work is registering it in the composed root's
child map and honouring `stackId` and `yAxisId` consistently with `<Bar>` and `<Line>`.

**4. Point labels.** `showLabels?: boolean` and `labelFormatter?: (v) => string` on `<Bar>`,
`<Line>` and `<Area>`. A five-bar chart in a report is often better read with values printed
on the marks than with an axis at all.

## Scope — Out

- Free-form annotations at arbitrary pixel positions. Data-space only — a pixel-anchored note
  drifts the moment the container resizes.
- Trend lines and regressions. Those are computed values; they belong in the consumer's
  shaping layer or in `@nqlib/nqchart/recipes`, not in the renderer.
- Interactive/draggable thresholds. Separate plan if it is ever genuinely wanted.

## Approach

- `ReferenceLine` / `ReferenceBand` compile to ECharts `markLine` / `markArea` entries on a
  synthetic series, so they layer above marks without joining the legend or the tooltip.
  Explicitly exclude them from legend `seriesKeys` — a threshold is not a series.
- Axis binding: both accept `yAxisId` / `xAxisId` and resolve through the same helper plan
  010 lifts into cartesian core. This plan should land **after** 010 for that reason.
- `tone` resolves through the existing token layer; no new colour vocabulary.
- `<Area>` in composed: register in the child map, share the stack-id namespace with `<Bar>`
  so a stacked bar and a stacked area do not silently join the same stack.

## Acceptance

- [ ] `<ReferenceLine>` draws a horizontal or vertical rule with a label, on every cartesian
      root, bound to the correct axis when two exist.
- [ ] `<ReferenceBand>` shades a range on either axis.
- [ ] Neither appears in the legend, and neither is reported by `onMarkClick`.
- [ ] Both read semantic tones and are legible in light and dark themes.
- [ ] `<Area>` renders inside `NQComposedChart` alongside `<Bar>` and `<Line>`, honouring
      `stackId` and `yAxisId`.
- [ ] `showLabels` / `labelFormatter` print values on bar, line and area marks.
- [ ] Verification gates from `docs/product/ai-contract.md` pass for touched surfaces
- [ ] Consumer skill updated (`pnpm sync:skills`) — with a budget-cap example
- [ ] Bug? → `.agents/skills/fixed/` note if non-trivial regression risk

## Out of scope / follow-ups

- Depends on plan 010 for the shared axis-binding helper. Sequence 010 → 011.
