# Plan 024 — Axis scales: log and time that work in every cartesian chart

- **Status:** DONE
- **Written:** 2026-11-13
- **Effort:** M · **Risk:** med
- **Skills:** `nqchart-dev` / `nqchart-docs` / `fixed`

## Why

`<XAxis>` and `<YAxis>` accept `scale` (`linear` | `log` | `time` | `category`), and the
consumer skill lists it. Only some charts honor it, and two of the scales give wrong charts.
A probe with ECharts 5.6 SSR on 2026-11-13 found these defects:

1. **`scale="time"` on the x axis puts every point in 1970.** The line compiler sends the
   series data as plain values (`[1, 2, 3]`). On a time axis, ECharts reads the index as the
   time, so the extent is 1970-01-01T00:00:00.001Z to .003Z.
2. **One zero value breaks a log axis.** Bars `0, 10, 1000` on `scale="log"` give the extent
   `[1, 10]`, so the 1000 bar goes off the plot. Without the zero, the extent is `[1, 1000]`.
3. **`NQScatterChart` ignores `scale`, `domain`, `reversed`, `unit`, and `tickFormatter`.**
   The props are on its `XAxis` and `YAxis` types, but `compile-scatter.ts` reads only
   `dataKey`. Both axes are always linear. A scatter chart is the chart that most needs a
   log axis.
4. **A stacked bar on a log axis is wrong.** A log axis cannot show a sum of segments.
   ECharts draws it, but the segment lengths do not mean anything.

No docs page and no example shows a log or time axis.

## Scope — In

1. **Scatter axes.** Apply the axis part (`scale`, `domain`, `reversed`, `unit`,
   `tickFormatter`, `labelRotate`) to both scatter axes with `applyAxisPartToOption`.
2. **Time x axis** for line, area, and scatter. When the x axis has `scale="time"`, each
   point is `[time, value]`. The time comes from the x `dataKey`, parsed as a `Date`, an ISO
   string, or epoch milliseconds. A row with a time that does not parse is skipped. The axis
   gets no `data` array.
3. **Log value axis** for bar, line, area, composed, and scatter. A value that is 0 or less
   has no log. It becomes a gap (`null`), and it does not change the axis extent.
4. **No stack on a log axis.** When the value axis is `log`, the compiler ignores `stackId`
   and `stackType`, and draws the bars side by side. The docs say this.
5. **Docs.** An "Axis scales" section on the line page (a time axis) and the scatter page
   (a log axis), with one example each. A short note on the bar page about log and stacks.
6. **Clean-up.** Remove `ticks` from `XAxisPart`. No compiler reads it, and no public prop
   sets it.

## Scope — Out

- A time axis for bar and composed charts. ECharts bars on a time axis need a computed bar
  width. Bar and composed charts keep a category x axis when `scale="time"`, and the docs
  say this.
- `scale` on the waterfall, tile column, heatmap, and calendar charts. Their axes are fixed
  by the chart.
- A symlog (log with zero) or a custom log base.
- Time zones. Times use the local time of the browser, which is the ECharts default.

## Approach

### Engine

- `cartesian-axes.ts`: add `axisScaleOf(part)` to return the ECharts axis type. Add
  `toTimeValue(raw): number | null` (Date, ISO string, or number → epoch ms).
- `cartesian-series.ts`: add `pointValue(row, xKey, valueKey, { time, log })`. It returns
  `[t, v]` on a time axis, `null` for a value of 0 or less on a log axis, and the plain value
  in other cases. Bar, line, area, and composed use it in place of `seriesValue`.
- `compile-line.ts`, `compile-area.ts`: with a time x axis, drop the category `data` array
  and `boundaryGap`, and send `[t, v]` points.
- `compile-bar.ts`, `compile-composed.ts`, `compile-area.ts`: when the value axis is `log`,
  do not set `stack` on the series. `normalizeStackPercent` does not run.
- `compile-scatter.ts`: build both axes with `applyAxisPartToOption`. Filter points with a
  value of 0 or less on a log axis. Parse time on a time x axis.
- The brush is category-only. On a time axis, the built-in brush (`dataZoom`) is off, and
  the root hides the footer brush (`supportsTimeAxis` in `createCartesianChart`, set by the
  line and area roots). The compact external-brush grid is off too.
- Tooltip: the axis tooltip reads `v` of `[t, v]`. A scatter point on a time axis carries a
  ready tooltip value (`NQ_TOOLTIP_VALUE`).
- Scatter API (additive): `XAxis` gets `domain` and passes `unit`. `Scatter` `data` accepts
  `ScatterDatum` (`number | string | Date` values) so a time x axis can take dates.

### Tests

- One test per defect in the Why section. Each test fails on `dev` today.
- A compile test for each chart family: the axis type, the point shape, and the stack.

### Docs and API

- No new prop. The fix makes `scale` do what the types and the consumer skill say.
- Add `ex-line-time-axis.tsx` and `ex-scatter-log-axis.tsx`. Run `pnpm run registry:fresh`.
- Update the line, scatter, and bar MDX pages, `docs/product/specs.md` (new S3.9), the
  consumer skill (`components.md`), then run `pnpm sync:skills`. Add a changelog entry.
- Add a fix note for the 1970 time axis and the log zero extent in `.agents/skills/fixed/`.

### Branch

`feat/024-axis-scales` from `origin/dev`. Do not start it in the working tree of plan 023.

## Acceptance

- [x] Line rows on `2026-01-01`, `2026-03-01`, and `2026-06-01` with `scale="time"` give an
      x extent in 2026, and the gap between the points follows the dates.
- [x] Bars `0, 10, 1000` on `scale="log"` give a y extent that includes 1000. The 0 bar is
      a gap.
- [x] `NQScatterChart` with `<XAxis scale="log" />` draws a log x axis. `domain` and
      `reversed` work on both scatter axes.
- [x] A stacked bar chart on a log axis draws its bars side by side.
- [x] `scale="time"` on a bar or composed chart keeps the category axis.
- [x] The line and scatter pages show a time example and a log example in light and dark.
- [ ] `pnpm preflight` passes.
- [x] Consumer skill, specs, MDX pages, and changelog are updated (`pnpm sync:skills`).
- [x] Fix note in `.agents/skills/fixed/`.

## Decisions

- **Stack on a log axis (Scope 4):** draw the bars side by side. The developer chose this
  on 2026-11-13. The rejected choice was to keep the stack and only warn in the docs.

## Out of scope / follow-ups

- A time axis for bar and composed charts.
- Symlog for data with zero and negative values.
