# Plan 016 — Per-family ECharts registration, honest export, internals check

- **Status:** DONE
- **Written:** 2026-08-12
- **Closed:** 2026-08-12
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
- Do not change any public **prop**. `ChartExportOpts.type` narrowing is the
  only public-type change.
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

## Out of scope / follow-ups

- SVG renderer / `renderer` prop — own plan if a consumer needs vector export.
- Splitting hover-focus imports out of `use-nq-echarts` (small vs the echarts tax).
- ECharts 6.x (EP-006).
