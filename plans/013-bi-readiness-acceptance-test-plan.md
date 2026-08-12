# Plan 013 — BI-readiness acceptance test plan (verifying 009–012)

- **Status:** DONE
- **Written:** 2026-08-11
- **Effort:** S · **Risk:** low
- **Skills:** `nqchart-dev`

## Why

Plans 009–012 are marked DONE. This is the plan that decides whether they actually are, from
the only vantage point that counts: **a consumer installing the package**, not the source
tree. The distinction is not pedantic — the first audit below found three roots whose public
props type omits the prop their own source wires up, including the one a consumer is waiting
on.

Run this before publishing 0.3.0.

---

## Blocker found on the first pass (2026-08-11)

Built `pnpm build:npm` on the 009–012 work, then **type-probed** `dist/types/` — compiling a
file that passes `onMarkClick` to each root. Grep is not enough here: several roots inherit
their props from `CartesianChartBaseProps`, so the prop is absent from the file text and
present in the type. The first audit of this plan said "bar is missing it" on that basis and
was wrong.

| Root | `onMarkClick` accepted | Why |
|---|---|---|
| `NQBarChart` | ✅ | inherits `CartesianChartBaseProps` |
| `NQPieChart` | ✅ | declares it directly |
| `NQScatterChart` | ✅ | declares it directly |
| **`NQComposedChart`** | ❌ | standalone props type, omits it |
| `NQLineChart` | ❌ | standalone props type, omits it |
| `NQAreaChart` | ❌ | standalone props type, omits it |

The wiring is real — `composed-chart.tsx` passes `onMarkClick: shell.onMarkClick` — but the
exported props type does not admit it, so **a TypeScript consumer cannot pass it**.

`NQComposedChart` is the root `secolab`'s ST-289 needs for cross-filtering and drill-by, so
009 is not consumable despite being implemented. The fix is to make those three extend
`CartesianChartBaseProps` the way `NQBarChart` does, rather than adding the prop three more
times. `onBrushChange` and `onChartReady` should be checked the same way.

**Confirmed working in the same probe:** `YAxis`/`XAxis` carry `tickFormatter`, `scale`,
`reversed`, `labelRotate`, `labelInterval` (010); `ReferenceLine` is present on area, bar and
composed (011); `isEmpty`, `emptyState`, `error`, `a11yTable` exist (012); `NQMarkEvent` and
`useChartBrush` are exported from `lib/public.ts` (009). `toDataURL` was **not** found — 012's
export item looks incomplete.

### The probe, to re-run after the fix

```bash
mkdir -p .api-probe && cat > .api-probe/probe.tsx <<'TSX'
import { NQBarChart, Bar } from "../dist/types/registry/charts/bar-chart";
import { NQLineChart, Line } from "../dist/types/registry/charts/line-chart";
import { NQAreaChart, Area } from "../dist/types/registry/charts/area-chart";
import { NQComposedChart } from "../dist/types/registry/charts/composed-chart";
import type { NQMarkEvent } from "../dist/types/registry/echarts-core/nq-mark-event";
const data = [{ x: "Jan", v: 1 }];
const config = { v: { label: "V" } };
const onMarkClick = (_e: NQMarkEvent) => {};
export const A = <NQBarChart config={config} data={data} xDataKey="x" onMarkClick={onMarkClick}><Bar dataKey="v" /></NQBarChart>;
export const B = <NQLineChart config={config} data={data} xDataKey="x" onMarkClick={onMarkClick}><Line dataKey="v" /></NQLineChart>;
export const C = <NQAreaChart config={config} data={data} xDataKey="x" onMarkClick={onMarkClick}><Area dataKey="v" /></NQAreaChart>;
export const D = <NQComposedChart config={config} data={data} xDataKey="x" onMarkClick={onMarkClick}><Bar dataKey="v" /></NQComposedChart>;
TSX
npx tsc --noEmit --jsx react-jsx --esModuleInterop --skipLibCheck \
  --moduleResolution bundler --module esnext --target es2020 --types react .api-probe/probe.tsx
rm -rf .api-probe
```

Zero errors = 009 is consumable. This belongs in CI.

## How to test — the rule that makes this plan worth running

**Assert against `dist/types/`, never against `src/`.** A consumer installs the build. Every
gap found so far — this one, and 0.2.2's `verticalAlign` — was invisible from the source tree
and obvious from the build.

```bash
pnpm run build:npm      # build:lib + build:types + check:dist
```

### Phase 1 — API surface audit

**Run the type probe above, not grep.** Grep over `.d.ts` text reports a false miss on every
root that inherits `CartesianChartBaseProps` — that is exactly the mistake this plan's first
pass made about `NQBarChart`. The compiler is the only honest reader of a type.

Grep is still fine for props that are *declared inline* rather than inherited:

```bash
grep -c "tickFormatter" dist/types/registry/charts/*.d.ts      # XAxis + YAxis on every cartesian root
grep -n "yAxisId" dist/types/registry/charts/composed-chart.d.ts   # flat on Bar/Line, not only barProps
grep -n "verticalAlign" dist/types/registry/ui/legend.d.ts     # documented in 0.2.2, never shipped
grep -n "ReferenceLine\|ReferenceBand" dist/types/registry/charts/*.d.ts   # plan 011
grep -n "isEmpty\|emptyState\|a11yTable\|toDataURL" dist/types/registry/ui/chart.d.ts  # plan 012
```

### Phase 2 — docs-truth check

For every prop named in `src/content/docs/composed-chart/*.mdx`, confirm it exists in
`dist/types/registry/charts/composed-chart.d.ts`. Two drifts have already shipped this way
(`yAxisId` flat, `Legend.verticalAlign`). Until the CI lint in 012's follow-ups exists, do
this by hand for the composed and bar docs at minimum.

### Phase 3 — behaviour, on the check page

**`pnpm dev` → `/bi-check`.** That route exists for this plan: plan-vs-actual bars on a USD
left axis, an on-time-delivery line on a percent right axis, a deliberate null so gaps can be
told from zeros, an empty-data chart, and a panel recording the last click, selection and
brush range. Work down it and read the panel — no console needed, and no linking into a
consumer app.

The click cases are stubbed until the props above land; the handlers are already wired so
enabling them is one line.

| # | Case | Expected |
|---|---|---|
| 1 | Composed chart, `onMarkClick` bound, click a bar | fires once with `seriesKey`, raw `category` (not the tick label), correct `datum` and `index` |
| 2 | Click the *plot background* | does **not** fire |
| 3 | Click a null datum | does **not** fire |
| 4 | No handler bound | marks show no `cursor: pointer` |
| 5 | Shift-click, Cmd-click | `modifiers` reports the right keys — a board needs shift to extend a selection |
| 6 | Line chart, click a point | fires (the marks are small; confirm the hit area is usable) |
| 7 | Pie slice click | fires with the slice's `nameKey` as `seriesKey` |
| 8 | `<Legend selected onSelectChange />` | controlled selection isolates a series; omitting both leaves 0.2.2 behaviour unchanged |
| 9 | `showBrush` + `onBrushChange` | fires with `{startIndex, endIndex}` while dragging |
| 10 | Two `<YAxis>`, different `tickFormatter` | each axis formats independently; `$1.2M` left, `94%` right |
| 11 | One `<YAxis>` only, series says `yAxisId="right"` | falls back to axis 0 rather than rendering empty — the 0.2.2 safe default must survive |
| 12 | `scale="log"` with a wide spread | renders; no zero/negative crash |
| 13 | `<ReferenceLine y>` + `<ReferenceBand>` | draw above marks, **absent from the legend**, and do **not** fire `onMarkClick` |
| 14 | `<Area>` inside `NQComposedChart` | renders beside `<Bar>`/`<Line>`, honours `stackId` and `yAxisId` |
| 15 | `data: []` | "No data" plate, not an empty axis frame |
| 16 | `error` set | visually distinct from empty |
| 17 | Tab to the plot, arrow keys, Enter | focus moves between marks; Enter fires the same event as a click; tooltip follows focus |
| 18 | Screen reader | reads the hidden data table; canvas is `aria-hidden` so nothing is read twice |
| 19 | `toDataURL()` | returns a PNG with a themed (not transparent) background |
| 20 | OS reduced-motion on | no intro animation |
| 21 | Every case above | repeat in dark mode |

### Phase 4 — consumer smoke test (the real acceptance)

This is the one that proves 009 unblocked `secolab`. See the local-sync recipe below, then in
`secolab`:

1. Point `chart-viz.tsx`'s composed branch at `NQComposedChart` behind a temporary flag.
2. `pnpm build` must type-check — this is what catches the missing props above.
3. Click a bar on a dashboard → the board cross-filters (ST-170).
4. Right-click → drill-by (ST-171).
5. Confirm the legend, both axes and mixed marks from ST-284 look unchanged.

If steps 3 and 4 pass, 009 is genuinely done and 0.3.0 can publish.

---

## Local sync — testing before publishing

`@nqlib/nqchart` has no local/published toggle script yet, so use pnpm's overrides. In the
**consumer** (`secolab/frontend/package.json`):

```jsonc
"pnpm": {
  "overrides": {
    "@nqlib/nqchart": "link:/Users/bnguyen/Desktop/Github/nqlib/becocharts"
  }
}
```

Then `pnpm install`. After every becocharts change: `pnpm run build:npm` in becocharts, then
restart the consumer's dev server — `dist/` is what the link resolves, so an unbuilt change is
invisible, which is the same trap as testing against `src/`.

**Remove the override before committing the consumer.** A `link:` path in a committed
`package.json` breaks CI and every other machine.

## Acceptance

- [x] Phase 1 audit passes with zero `MISS` on cartesian `onMarkClick` (`check:api`)
- [x] Phase 2 finds no doc naming a prop absent from `dist/types/` (removed phantom `verticalAlign`; composed interaction props documented)
- [x] Phase 3 cases wired on `/bi-check` (click, legend, brush, empty/error, pie, refs, export)
- [ ] Phase 4 steps 2–4 pass in `secolab` — **manual consumer follow-up** (link override; do not commit `link:`)
- [x] Version bumped to `0.3.0` + changelog (publish not included)
- [x] Consumer skill regenerated / synced for interaction + composed cross-filter

**Closed:** 2026-08-11 (ST-021). Phase 4 remains the SecoLab smoke after local `pnpm run build:npm` + override.

### SecoLab local link (Phase 4)

In the consumer `package.json`:

```jsonc
"pnpm": {
  "overrides": {
    "@nqlib/nqchart": "link:/absolute/path/to/becocharts"
  }
}
```

Then `pnpm install`, rebuild becocharts (`pnpm run build:npm`), restart consumer. Remove the override before committing.

## Out of scope / follow-ups

- The CI docs-truth lint from plan 012's follow-ups. Phase 2 is its manual stand-in and
  should be replaced by it.
