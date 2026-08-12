# Plan 014 — Make the interaction API consumable (unblock 0.3.0)

- **Status:** DONE
- **Written:** 2026-08-11
- **Effort:** S · **Risk:** low
- **Skills:** `nqchart-dev` / `nqchart-docs`

## Why

009–012 are implemented. **009 is not consumable**, and that is the only thing standing
between here and publishing 0.3.0.

Three chart roots declare standalone props types that omit `onMarkClick`, so a TypeScript
consumer cannot pass it even though the component wires it internally. Verified with the
compiler against `dist/types/`, not by grep — grep gives a false miss on every root that
inherits `CartesianChartBaseProps`, which is how an earlier pass wrongly accused `NQBarChart`:

| Root | Accepts `onMarkClick` | Why |
|---|---|---|
| `NQBarChart` | ✅ | inherits `CartesianChartBaseProps` |
| `NQPieChart` | ✅ | declares it directly |
| `NQScatterChart` | ✅ | declares it directly |
| **`NQComposedChart`** | ❌ | standalone props type |
| `NQLineChart` | ❌ | standalone props type |
| `NQAreaChart` | ❌ | standalone props type |

`composed-chart.tsx` already passes `onMarkClick: shell.onMarkClick` — the plumbing is there,
the door is locked from the outside.

**Who is waiting:** `secolab` ST-289 needs `onMarkClick` on `NQComposedChart` to keep board
cross-filtering (ST-170) and drill-by (ST-171) through a renderer migration. That story is
parked on this plan.

`toDataURL` from 012 was also not found in the build.

## Scope — In

**1. Three roots inherit the base props type.** Do not add the prop three more times — that is
how the divergence happened. Make `NQComposedChartProps`, `NQLineChartProps` and
`NQAreaChartProps` extend `CartesianChartBaseProps` the way `NQBarChartProps` does:

```ts
type NQComposedChartProps<TData, TConfig> =
  Omit<CartesianChartBaseProps<TData, TConfig>, "config"> & {
    config: TConfig;
    loadingBars?: number;
    barRadius?: number;
    brushFormatLabel?: (value: unknown, index: number) => string;
  };
```

Anything already on the standalone type and genuinely root-specific stays; anything the base
also declares comes from the base.

**2. Audit `onBrushChange` and `onChartReady` the same way.** 009 promised both. Neither
appeared on any root in the build. `onBrushChange` is required only where `showBrush` is
accepted; `onChartReady` belongs on every root.

**3. `toDataURL`.** 012's export item. Forward `getDataURL` from the ECharts instance through
`useImperativeHandle` so a consumer can wire a download or drop a chart into a report. Default
the background to the resolved surface token — an exported PNG must not be
transparent-on-white in a dark-themed app.

**4. A CI type probe, so this cannot regress.** The reason this shipped is that nothing
compiles against the built types. Add `pnpm run check:api`:

```bash
# scripts/check-api.mjs — build a probe, compile it against dist/types, fail on any error
```

The probe passes every documented interaction prop to every root. It runs after
`build:types` in `build:npm`, so a props type that stops accepting a documented prop breaks
the build rather than a consumer.

## Scope — Out

- Any new capability. This plan exposes and guards what 009–012 already built.
- The docs-truth lint (012's follow-up). Related, larger, separate.
- Renaming or reshaping `NQMarkEvent`. It is already exported and correct.

## Approach

- `src/registry/charts/{composed,line,area}-chart.tsx` — swap the standalone props type for
  the base-extending form. `NQBarChart` is the reference implementation.
- Check for prop-name collisions while merging: if a root declares its own `className` or
  `isLoading`, prefer the base and delete the local one, or the two will drift again.
- `check-api.mjs`: generate the probe into a temp dir, run `tsc --noEmit` with the same flags
  a consumer uses (`moduleResolution bundler`), clean up, exit non-zero on any diagnostic.

## Acceptance

- [x] The type probe in plan 013 compiles with **zero** errors (via `check:api`).
- [x] `onMarkClick` is accepted by bar, line, area, composed, pie and scatter roots.
- [x] `onChartReady` is accepted by every root; `onBrushChange` by every root taking `showBrush` (incl. waterfall).
- [x] `toDataURL` reachable via `chartRef` (themed background in `chart-handle`).
- [x] `pnpm run check:api` exists, runs inside `build:npm`, and fails if a prop disappears.
- [x] `pnpm test` still green
- [x] Verification gates from `docs/product/ai-contract.md` pass for touched surfaces
- [x] Consumer skill updated — composed cross-filter example
- [x] Fix note: standalone props silently drop inherited factory props

**Closed:** 2026-08-11 (ST-020).

## How to test

```bash
pnpm run build:npm      # includes check:api once step 4 lands
pnpm test
pnpm dev                # → /bi-check, then enable the stubbed handlers on that page
```

`/bi-check` is the manual surface (plan 013, phase 3). Its click cases are stubbed with an
amber note naming this blocker; deleting that note and binding the handlers is the visible
proof this plan worked.

## Success criteria

**One sentence: a consumer can build a cross-filtering dashboard without touching
`onChartReady`.** Concretely — clicking a bar on `/bi-check` updates the panel with the right
category, series and modifiers; the probe compiles clean; and `secolab` can point
`chart-viz.tsx` at `NQComposedChart` and still cross-filter and drill.

Publish 0.3.0 only after all three.

## Out of scope / follow-ups

- The docs-truth lint from 012's follow-ups.
- `NQFunnelChart`, `NQTreemapChart` and `NQRadialChart` also lack `onMarkClick`. Not blocking
  any consumer today; fold into this plan if it is cheap once the base-props pattern is in
  place, otherwise its own plan.
