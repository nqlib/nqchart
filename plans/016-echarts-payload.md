# Plan 016 — Per-family ECharts registration, honest export, internals check

- **Status:** VERIFY — ready to tag v0.3.1; owner publishes npm
- **Written:** 2026-08-12
- **Closed:** 2026-08-12
- **Reopened:** 2026-08-12 (consumer driving 0.3.0 against `/charts/lab`)
- **Effort:** M · **Risk:** med
- **Skills:** `nqchart-dev` / `nqchart-docs`
- **Story:** [ST-022](../docs/product/epics/EP-005-distribution/stories/ST-022-echarts-payload.md)

## Why

0.3.0 is correct. It is also heavy. A consumer who imports `@nqlib/nqchart/bar-chart`
pays **every** ECharts chart type and component the library can draw, because
`echarts-init.ts` registers one fixed list and `use-nq-echarts.ts` calls it at
module scope. Measured against the published 0.3.0 tarball (esbuild minify + gzip):

| Import | minified | gzip |
|---|---|---|
| echarts, hand-picked for one bar chart | 516 KB | 175 KB |
| `@nqlib/nqchart/bar-chart` | 998 KB | **333 KB** |

SecoLab ships this in a Tauri binary (ST-289). The 158 KB gzip tax is the difference
between one chart library and two.

Two narrower gaps ride along: `toDataURL({ type: "svg" })` cannot work (only
`CanvasRenderer` is registered), and nine files import private `echarts/lib/...`
paths under a `^5.6.0` peer range with no CI check.

## Scope — In

1. **Per-family module list.** `getEcharts(extra?)` keeps BASE
   (`CanvasRenderer`, `GridComponent`, `TooltipComponent`, `LegendComponent`)
   and accepts extras. Each family passes only what its compile module draws.
   Registration stays inside a **called function**. Target: bar-chart ≤ **200 KB gzip**.
2. **`check:size`.** Bundle each family entry with esbuild (echarts included,
   react/motion external), gzip, compare to a committed baseline. Fail on >5%
   growth. Run inside `build:npm` after `check:api`.
3. **Narrow `ChartExportOpts.type` to `"png"`.** Honest surface. SVG renderer
   is a feature, not this fix.
4. **`check:internals`.** Resolve the three private echarts paths against the
   installed package; fail the build if one moves. Document in
   `docs/architecture/public-surface.md`. Dedupe the duplicate module
   declarations (`echarts-internals.d.ts` vs `src/types/globals.d.ts`).
5. Bump to **0.3.1**. Do not publish.

## Scope — Out

- Do not set `"sideEffects": true`.
- Do not move `echarts.use([...])` to module top level (tree-shaken away;
  `Renderer 'undefined' is not imported`).
- Do not bundle echarts (peer, stay external in `vite.lib.config.ts`).
- Do not change any public **prop** except the 0.3.1 follow-up: `<Line variant="dashed" | "dotted">` (composed also `"points"`). `ChartExportOpts.type` narrowing is the other public-type change.
- Do not remove the private echarts imports (hover-focus / rollout intro).
- Do not register `SVGRenderer` or add a `renderer` prop.
- Do not touch plans 009–015.
- Do not publish npm.

## Approach

### Finding 1 — registration as a parameter

`echarts-init.ts` currently imports every chart + component. Every family
imports `use-nq-echarts`, which calls `getEcharts()` at module scope, so
Rollup cannot drop `GaugeChart` from the bar-chart entry.

**Constraint that must survive:** `package.json` has `"sideEffects": false`.
A bare top-level `echarts.use([...])` in a re-export-only module is dropped.
The comment on `getEcharts` is correct. Registration must stay inside a
function that is **called**.

```ts
const BASE = [CanvasRenderer, GridComponent, TooltipComponent, LegendComponent];

export function getEcharts(extra: readonly unknown[] = []): typeof echarts {
  echarts.use([...BASE, ...extra]); // idempotent; keep a per-set guard
  return echarts;
}
```

`echarts-init.ts` imports **only** BASE. Extras are imported in the family
file (or passed into `createCartesianChart`) so they land in that family's
chunk.

Thread extras: family → `EChartsHost` → `useNQEcharts` → `getEcharts(extra)`
**inside the init effect** (a called function, immediately before `init`).
Also call `getEcharts(MODULES)` at **family module scope** so the brush mini
preview (a second `EChartsHost`) cannot init before extras are registered.
Both calls are functions; neither is a top-level `echarts.use`.

`getEcharts()` with no argument still registers BASE.

Per-family extras, derived from each compile module:

| Family | Extra modules |
|--------|----------------|
| bar | `BarChart`, `CustomChart` (monospace), `GraphicComponent` (hover-trace) |
| line | `LineChart` |
| area | `LineChart` |
| composed | `BarChart`, `LineChart`, `CustomChart` (whiskers) |
| scatter | `ScatterChart` |
| pie | `PieChart` |
| radar | `RadarChart`, `RadarComponent`, `PolarComponent` |
| radial | `GaugeChart`, `BarChart`, `PieChart` (rose labels), `PolarComponent` |
| heatmap | `HeatmapChart`, `VisualMapComponent`, `DataZoomComponent` |
| calendar | `HeatmapChart`, `CalendarComponent`, `VisualMapComponent` |
| funnel | `FunnelChart`, `CustomChart` (pipe) |
| treemap | `TreemapChart` |
| waterfall | `BarChart` |
| sparkline | `LineChart` |

Cartesian families do **not** register `DataZoomComponent`. `BrushPart` is never
mounted; zoom is the custom `NQChartBrush` footer. Heatmap is the only family
that emits ECharts `dataZoom`.

Registry chrome uses `src/registry/lib/cn.ts` (clsx only) so a family entry does
not pay `tailwind-merge` (~8 KB gzip). That cut is what lands bar-chart under
200 KB gzip.

**Reversal of a prior rejection.** `plans/README.md` listed per-chart
registration as considered-and-rejected ("breaks the registry standalone-file
story"). That was true when extras lived in a shared init file. Declaring
extras **in the family file** makes a shadcn copy of one chart self-contained
and is what the npm per-entry build needs. Update that README note.

### Finding 2 — export type

Confirm canvas `getDataURL({ type: "svg" })` in a real init (jsdom or
Playwright) before changing the type. Then narrow to `"png"`, drop the svg
branch, note the renderer limit on `ChartExportOpts`. Update MDX / skill /
`public-surface.md` that say "PNG/SVG". Vector export needs its own plan
(root `renderer` prop + `SVGRenderer`).

### Finding 3 — private paths

Keep:

- `echarts/lib/util/states.js` (six hover-focus files)
- `echarts/lib/animation/basicTransition.js`
- `echarts/lib/util/graphic.js` (`apply-rollout-intro.ts`)

`scripts/check-internals.mjs` `createRequire`s each path against installed
echarts and exits non-zero if missing. Verified version: **echarts 5.6.0**.
Delete the duplicate `declare module` blocks from `src/types/globals.d.ts`
(keep `echarts-internals.d.ts`, which also covers `states.js`).

### Guards in `build:npm`

```
build:lib → build:types → check:dist → check:api → check:internals → check:size
```

`check:size` methodology (must match the 0.3.0 measurement, not the published
`dist` with echarts external):

- Entry: `src/registry/charts/<family>-chart.tsx`
- esbuild bundle + minify
- external: `react`, `react-dom`, `react/jsx-runtime`, `motion`, `motion/*`
- **include echarts** (that is the tax)
- gzip; compare to `scripts/size-baseline.json`
- fail if any family grows **> 5%** over baseline

Measure 0.3.0 **on this branch before changing `echarts-init.ts`** for the PR
table. Commit the **post-fix** numbers as the baseline so a regression back
toward the full-library set trips the check.

## Acceptance

- [x] `@nqlib/nqchart/bar-chart` ≤ 200 KB gzip (stated in the PR body)
- [x] PR body has before/after gzip for **every** family entry (0.3.0 vs this)
- [x] `getEcharts` still works with no argument; `echarts.use` is never top-level
- [x] `"sideEffects"` stays `false`; echarts stays a peer / vite external
- [x] `ChartExportOpts.type` is `"png"` only; svg behaviour recorded in the PR
- [x] `pnpm run check:size` and `pnpm run check:internals` run inside `build:npm`
- [x] `pnpm run check:api` stays green (no public prop changes)
- [x] `pnpm run build:npm`, `pnpm test`, `pnpm run lint` pass
- [x] `/bi-check`: click, legend, brush, empty, error, export still work
- [x] Changelog 0.3.1; `package.json` 0.3.1; **not published**
- [x] Consumer skill + `pnpm sync:skills` if export copy changed
- [x] **`variant="dashed"` on Line (and Area).** `lineStyleType()` maps `dashed` / `dotted` (and Area `dashed-stroke`). Standalone `<Line variant>` is `"solid" | "dashed" | "dotted"`; composed also keeps `"points"`. Compilers set `lineStyle.type`.
- [x] **Pie a11y table is empty.** `derivePieSeriesKeys` keys the table off the value column (explicit key, else `"value"`, else first non-name column). Do not use `Object.keys(config)` for pie.

## Out of scope / follow-ups

- SVG renderer / `renderer` prop — own plan if a consumer needs vector export.
- Splitting hover-focus imports out of `use-nq-echarts` (small vs the echarts tax).
- ECharts 6.x (EP-006).

## Session log — 2026-08-12

Shipped on `feat/016-echarts-payload` (`eccb03d`). Package **0.3.1**, not published.
Push to `nqlib/beecharts` was blocked (GitHub token for `bnguyenSVG` 403).

**Finding 1.** `echarts-init.ts` registers BASE only. Each family file imports its
chart/component modules, calls `getEcharts(MODULES)` at module scope, and passes
`echartsModules` into `EChartsHost` / `createCartesianChart`. `use-nq-echarts`
calls `getEcharts(extra)` inside the init effect (never top-level `echarts.use`).
Registry `cn` is clsx-only (`src/registry/lib/cn.ts`) so a family entry does not
pay `tailwind-merge`. Bar-chart: **273.5 → 198 KB gzip** (same `check:size`
method as the gate; the work-order 333 KB figure was the published tarball).

**Finding 2.** `ChartExportOpts.type` is `"png"` only. Chromium:
`canvas.toDataURL("image/svg")` → `data:image/png;base64,…`. ECharts canvas
`getDataURL` does `toDataURL('image/' + type)`.

**Finding 3.** `scripts/check-internals.mjs` + `check:size` run inside
`build:npm`. Duplicate `declare module` blocks removed from `globals.d.ts`.

**Gotchas found while verifying `/` and `/bi-check`:**

1. Guard extras by **module identity**, not a string key. Pie `[PieChart]` and
   line `[LineChart]` both stringified to `"mod"`, so the later family never
   registered (`Series pie is used but not imported`).
2. Do not put `dataZoom: undefined` (or calendar/visualMap) on the option.
   ECharts treats a present key as “this component is used”. Compilers omit the
   key when zoom is off; `apply-chart-chrome` deletes nullish keys;
   `to-mini-preview-option` `delete`s `dataZoom` instead of setting `undefined`
   (the brush mini-preview is a second `EChartsHost` without DataZoom).
3. `resolveAreaFillColor` must not touch `document` during SSR (`/bi-check` 500).

**Consumer findings — 2026-08-12** (driving 0.3.0 via nqui-showcase `/charts/lab`; both must land before 0.3.1 publishes):

4. **Harness, not library.** A synthetic `click` from an automation tool does not reach ECharts. Events must be a `mousedown` / `mouseup` / `click` sequence on the canvas. First two automated clicks appeared to do nothing; the handler was fine. Recorded so the next run does not file a false bug.
5. **Null stays a gap — confirmed.** Hidden cartesian a11y table: `2026-05` actual is an empty cell, neighbouring series untouched, nothing drawn as zero. Dual axis (`$` left, `%` right), mixed bar+line, and legend all survive (ST-284 output intact).
6. **Pie a11y table is a grid of blanks** (see acceptance above). Consumer turned `a11yTable` off for the donut only, with a comment naming the bug. Cartesian tables stay on.
7. **No dashed line style** (see acceptance above). **Landed:** `lineStyleType()` in `cartesian-series.ts`; Line `variant` on standalone + composed; `check:api` probes `variant="dashed"`.

**Implementation — 2026-08-12 (this follow-up):** dashed Line + pie a11y table; Area+Line same dataKey (`uniquifySeriesIds` + one legend row). Lab pins `composition.dashed-line`, `a11y.pie-table`, `composition.shared-datakey`. Tag `v0.3.1`; do not `pnpm publish:npm` from the agent.

## How to test

### Automated (must stay green)

```bash
pnpm test
pnpm run lint          # 0 errors; existing warnings OK
pnpm exec tsc --noEmit
pnpm run check:size    # bar-chart ≤ 200 KB gzip; no family >5% over baseline
pnpm run check:internals
pnpm run check:api
pnpm run build:npm     # lib → types → dist → api → internals → size
```

`check:size` prints every family. Confirm **bar-chart ~198 KB gzip**. To refresh
the committed baseline after a deliberate payload change:
`node scripts/check-size.mjs --write`.

Type-level export check: `toDataURL({ type: "svg" })` must be a TS error;
`toDataURL()` / `toDataURL({ type: "png" })` must typecheck.

### Manual — `/bi-check` (`pnpm exec next dev --port 3001`)

Open `http://localhost:3001/bi-check`. DevTools console must **not** show
`Component X is used but not imported` / `Series X is used but not imported`.

| Check | What to do | Pass |
|-------|------------|------|
| Export | Click **Export PNG via chartRef.toDataURL()** | Panel: `PNG ok (… chars)` |
| Click | Click a **bar** in section 1 (not the a11y table). Real pointer or a `mousedown`/`mouseup`/`click` sequence on the **canvas** — a synthetic `click` alone does not reach ECharts. | `last mark click` shows series key + raw category; count increments |
| Empty plot | Click the plot background | Count does **not** move |
| Legend | Click a legend swatch/label (HTML legend, not `<th>`) | `legend selection` updates |
| Brush | Drag the footer brush on section 1 | `brush range` shows `start…end` |
| Empty plate | Section 5 left | “no data” plate, no canvas crash |
| Error plate | Section 5 right | “Failed to load series”, distinct from empty |
| Pie click | Section 6 pie slice | Panel updates `seriesKey` |

Also load `/` (demo dashboard: area, bar, pie, radial). Same: no “not imported”
warnings; charts draw; area/bar footer brush mini-preview draws.

Spot-check docs pages that use modules other families omit: `/docs/heatmap-chart/static`,
`/docs/calendar-chart/static`, `/docs/radar-chart/static`, `/docs/funnel-chart/static`.

Showcase lab (`nqui-showcase`, `pnpm dev:local:charts`): `/charts/lab` cases
`composition.dashed-line` and `a11y.pie-table` must pass.

Do **not** `pnpm publish:npm`.
