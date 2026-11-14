# Plan 023 — Waterfall: direction colors, connectors, signed labels, horizontal layout

- **Status:** DONE
- **Written:** 2026-11-13
- **Effort:** M · **Risk:** med
- **Skills:** `nqchart-dev` / `nqchart-docs` / `fixed`
- **Story:** [ST-028](../docs/product/epics/EP-003-chart-craft/stories/ST-028-waterfall-direction.md)

## Why

A waterfall must show if each step goes up or down. `compile-waterfall.ts` colors each column
by its category name, so the reader cannot see the direction. A floating column rounds both
ends, so the shape does not show the direction either. There are no connector lines and no
signed labels.

The chart also has a bug. When the running total goes below zero, ECharts stacks by sign
(`samesign`), and the column is drawn from zero instead of from the running total.

A P&L or a variance bridge has many steps with long names. These read better as a horizontal
chart, from top to bottom. The waterfall has no horizontal layout.

## Scope — In

1. **Color by direction (default).** An increase, a decrease, and a total each get one color.
   `start` and `total` rows use the total color.
2. **`higherIsBetter`.** When it is `false`, an increase uses the bad color and a decrease uses
   the good color (a cost bridge). The name and meaning are the same as on `NQKpiCard`.
3. **Connector lines (opt-in).** A thin line goes from the end of each column to the start of the next
   column, at the running total.
4. **Signed labels.** A step shows `+45` or `−15` at its moving end. A total shows its value with
   no sign. The labels use the chart value formatter.
5. **Rounded moving end.** A floating step rounds only the end that the step moves to. The
   start end stays square.
6. **Horizontal layout.** `layout="horizontal"` puts the categories on the y axis, from top to
   bottom. The meaning is the same as the `NQBarChart` `layout` prop.
7. **Fix: running total below zero.** The column starts at the running total in all cases.
8. **Tooltip.** The tooltip shows the signed step and the running total.

## Scope — Out

- An arrow or chevron end. It does not match the rounded signature. It can be an example later.
- Per-category colors as a separate prop. `colorBy="category"` keeps the old look.
- Animation that grows each step from the previous step.

## Approach

### Public API (additive, minor version)

On `NQWaterfallChart` and `WaterfallPart`:

| Prop | Type | Default | Effect |
|------|------|---------|--------|
| `colorBy` | `"direction" \| "category"` | `"direction"` | `"category"` keeps the 0.5 look |
| `higherIsBetter` | `boolean` | `true` | Swaps the good and bad colors |
| `layout` | `BarLayout` | `"vertical"` | `"horizontal"` draws rows |
| `connectors` | `boolean` | `false` | Draws the step lines |
| `showLabels` | `boolean` | `true` | Draws the signed labels |

The colors come from the `config` keys `increase`, `decrease`, and `total`. The config label
also names the legend entry. When a key is not in `config`, the color falls back to the
`NQKpiCard` tone colors: emerald for good, red for bad, and the muted foreground for a total.
Each fallback must have a light and a dark value, and must pass 3:1 on the card surface.

Warning: the default changes from category colors to direction colors. This is a visible
change. The changelog must say it, and must name `colorBy="category"` as the way back.

### Engine (`compile-waterfall.ts`)

- Keep the two stacked bar series (transparent placeholder + values). This keeps the hover
  repair (`hover-focus-waterfall-blur`) and `fitRenderedBarCorners` as they are.
- Set `stackStrategy: "all"` on both series. The values column then stacks on the placeholder
  for every sign, so a step that crosses zero starts at the running total. ECharts 5.6 has
  this option.
- Move the row math into a pure function `buildWaterfallSteps(rows)`. It returns, for each row,
  the kind, the signed delta, the start, the end, and the running total. Unit-test it.
- Horizontal: swap `xAxis` and `yAxis`. Set `inverse: true` on the category axis so the first
  step is at the top.
- Corners: `signedBarBorderRadius` rounds the moving end. A floating step no longer rounds
  both ends.
- Labels: a per-datum `label.position` (`top` / `bottom`, or `right` / `left` when horizontal).
- Connectors: one silent `custom` series. `renderItem` uses `api.coord` and `api.size` to draw
  a 1px line from the edge of column `i` to the edge of column `i + 1`, at the running total.
  The color is the split-line color. The series has no emphasis and no tooltip. Add
  `CustomChart` to `WATERFALL_ECHARTS_MODULES` and check the bundle size (plan 016).
- Legend: the legend shows the three direction entries when the chart has a legend part.

### Docs and examples

- Update `src/content/docs/waterfall-chart/static.mdx`: direction colors, `higherIsBetter`,
  and a horizontal P&L example.
- Add `ex-waterfall-horizontal-pnl.tsx` (Revenue → COGS → Gross profit → Opex → Net income).
- Add `ex-waterfall-cost-bridge.tsx` with `higherIsBetter={false}`.
- Run `pnpm run registry:fresh`.
- Update `docs/product/specs.md`, the consumer skill (`components.md`, `recipes.md`), then run
  `pnpm sync:skills`. Add a changelog entry.

## Acceptance

- [x] Each step has the increase, decrease, or total color. `higherIsBetter={false}` swaps the
      increase and decrease colors.
- [x] Rows `start 10`, `−30`, `+5`, `total` draw columns 0→10, 10→−20, −20→−15, 0→−15.
- [x] With `connectors`, a line joins each column to the next at the running total, in both
      layouts. The lines are off by default.
- [x] Labels show `+N` / `−N` at the moving end and do not clip at the plot edge.
- [x] `layout="horizontal"` puts the first step at the top.
- [x] Hover still dims the other columns and keeps the hovered column at full color. The
      connectors do not react to hover.
- [x] `colorBy="category"` gives each column its own category color, as in 0.5.
- [x] Light and dark mode: each direction color passes 3:1 on the card surface.
- [ ] `pnpm preflight` passes. `check:api` probes the new props.
- [x] Consumer skill, specs, MDX page, and changelog are updated (`pnpm sync:skills`).
- [x] Fix note `.agents/skills/fixed/fixes/cartesian-stack-waterfall-negative-running-total.md`.

## Out of scope / follow-ups

- Arrow-end variant as an example only.
- Grow-from-previous-step intro animation.
