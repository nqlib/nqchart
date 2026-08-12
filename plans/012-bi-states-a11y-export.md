# Plan 012 — Empty/error states, keyboard access, and export

- **Status:** DONE
- **Written:** 2026-08-11
- **Effort:** M · **Risk:** low
- **Skills:** `nqchart-dev` / `nqchart-docs`

## Why

The three things a chart library is judged on once it is in production, and none of which
show up in a demo: what it does when there is no data, whether anyone who cannot use a mouse
can read it, and whether a number can leave the screen.

NQChart has `isLoading` and a skeleton — the loading state is handled. The other states are
not: an empty result and a failed query both render as an empty plot frame, which reads as
"zero" rather than "nothing to show" or "this broke". In a BI board those are three
different messages and a reader who confuses them makes a decision on a chart that had no
data in it.

Accessibility is the same argument with a compliance edge. The chart is a `<canvas>`, so a
screen reader gets nothing at all today, and no mark can be reached by keyboard.

## Scope — In

**1. Empty and error states on every root.**

```ts
isLoading?: boolean;                 // exists
isEmpty?: boolean;                   // default: derived from data.length === 0
emptyState?: React.ReactNode;        // default: a quiet "No data" plate
error?: React.ReactNode;             // renders instead of the chart
```

Derive `isEmpty` by default so a consumer gets the good behaviour without opting in, but let
it be overridden — "all values are null" is empty too, and only the caller knows.

**2. A data table fallback, which is also the accessibility answer.**

```ts
a11yTable?: boolean;    // default true — visually hidden <table> mirroring the series
a11yLabel?: string;     // one-sentence summary on the container
a11ySummary?: string;   // optional longer description
```

A visually hidden table is the honest fix for canvas charts: it gives a screen reader the
actual numbers rather than a description of them, it costs nothing visually, and it doubles
as the print fallback. Default it on.

**3. Keyboard access to marks.** The plot becomes focusable; arrow keys move a cursor across
categories and series; Enter fires the same `NQMarkEvent` as a click (plan 009). A tooltip
follows focus, not only hover. This is what makes a cross-filter dashboard usable without a
mouse.

**4. Export.**

```ts
// via the ref or onChartReady handle
toDataURL(opts?: { type?: "png" | "svg"; pixelRatio?: number; backgroundColor?: string }): string
```

ECharts provides this; expose it on a ref so a consumer can wire "download PNG" or drop a
chart into a generated report. Default the background to the resolved surface token so an
exported PNG is not transparent-on-white in a dark-themed app.

**5. `prefers-reduced-motion`.** Disable intro and transition animation when the user asks
for it. One guard in the animation config.

## Scope — Out

- Server-side rendering of charts to images. A different runtime; separate concern.
- CSV/XLSX export of the underlying data — the consumer owns the data, and it usually has
  more of it than the chart shows.
- A full ARIA grid interaction pattern. The hidden table plus focusable marks is the
  proportionate answer; a grid pattern is a research project.

## Approach

- States: one wrapper in the shared plot shell, ahead of the canvas mount, so every root
  inherits the behaviour without per-chart work.
- a11y table: generate from `config` + `data` in the shell. `sr-only` styling, `aria-hidden`
  on the canvas so the two are not read twice.
- Keyboard: a focus index in the shell, mapped through the same `params → NQMarkEvent`
  helper plan 009 builds. Sequence 009 → 012 for that reason.
- Export: forward `getDataURL` from the instance via `useImperativeHandle`.

## Acceptance

- [ ] An empty result renders a "No data" plate, not an empty axis frame; `emptyState`
      overrides it; `isEmpty` can be forced.
- [ ] `error` renders instead of the chart, and is visually distinct from empty.
- [ ] Every chart emits a visually hidden table of its series and values by default;
      the canvas is `aria-hidden` so nothing is announced twice.
- [ ] The plot is focusable; arrow keys move between marks; Enter fires `onMarkClick`;
      the tooltip follows keyboard focus.
- [ ] `toDataURL()` returns a PNG or SVG with a themed background.
- [ ] Animations are suppressed under `prefers-reduced-motion`.
- [ ] Verification gates from `docs/product/ai-contract.md` pass for touched surfaces
- [ ] Consumer skill updated (`pnpm sync:skills`)
- [ ] Bug? → `.agents/skills/fixed/` note if non-trivial regression risk

## Out of scope / follow-ups

- **A docs-truth lint.** The drift plan 010 fixes by hand will recur: the composed-chart doc
  described `yAxisId` flat and `Legend.verticalAlign` as shipped, and neither was true of the
  published types. A CI step that reads `dist/types/` and checks every prop named in the docs
  exists in the built `.d.ts` would have caught both. Worth its own small plan.
- Depends on 009 for the mark-event helper. Sequence 009 → 012.
