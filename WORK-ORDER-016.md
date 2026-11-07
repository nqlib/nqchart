# Work order — NQChart 0.3.1: pay the echarts bundle tax, close two export gaps

**Repo:** `/Users/bnguyen/Desktop/Github/nqlib/becocharts`
**Base:** `main` at `6b987b7` ("Release v0.3.0 — BI interaction, axes, a11y")
**Written:** 2026-08-12. Every claim below was verified against the **published**
`@nqlib/nqchart@0.3.0` tarball and against the source at that commit.

## Read this first

Plans live in `plans/`. Read `plans/README.md`, then write **plan 016** from this document
before you edit `src/`. That order is the repo's own rule
(`.cursor/rules/agent-intake-plan-before-code.mdc`). Register the plan in `plans/README.md`.

Branch from `main`:

```bash
cd /Users/bnguyen/Desktop/Github/nqlib/becocharts
git checkout main && git pull
git checkout -b feat/016-echarts-payload
pnpm install
```

The working tree currently holds an uncommitted edit to `src/content/docs/installation.mdx` and
an untracked `.cursor/skills/`. Deal with those before you branch, so they do not ride along.

## Credit where it is due

0.3.0 is good work. I installed the published package into a clean project and compiled a
consumer probe against its entry points. It compiles with zero errors. `onMarkClick` reaches all
14 roots, the four cartesian roots inherit it properly rather than redeclaring it, and
`check:api` now guards the surface in CI. Plan 014 fixed the right thing in the right way. This
order is about payload and two narrow gaps, not about correctness.

---

# Finding 1 — one chart costs the whole library

## Measured, not estimated

I bundled each import with esbuild, minified, then gzipped.

| Import | minified | gzip |
|---|---|---|
| `recharts` — BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer | 351 KB | **105 KB** |
| echarts, hand-picked for one bar chart (core, BarChart, Grid, Tooltip, Legend, CanvasRenderer) | 516 KB | **175 KB** |
| `@nqlib/nqchart/bar-chart` | 998 KB | **333 KB** |

A consumer who wants one bar chart pays **158 KB gzip** above a hand-picked echarts setup. The
per-family subpath exports do not reduce the echarts payload at all.

## Why it happens

`src/registry/echarts-core/echarts-init.ts` registers every module the library can use, in one
function:

```ts
export function getEcharts(): typeof echarts {
  if (!registered) {
    echarts.use([ BarChart, CustomChart, LineChart, PieChart, HeatmapChart, GaugeChart,
                  RadarChart, ScatterChart, TreemapChart, FunnelChart, CalendarComponent,
                  GraphicComponent, GridComponent, TooltipComponent, LegendComponent,
                  VisualMapComponent, DataZoomComponent, PolarComponent, RadarComponent,
                  CanvasRenderer ]);
    registered = true;
  }
  return echarts;
}
```

`src/registry/echarts-core/use-nq-echarts.ts:27` calls it at module scope. Every chart family
imports `use-nq-echarts`. `vite.lib.config.ts` builds one entry per family and bundles
`echarts-core` internals into each entry. So the bar-chart entry statically references
`GaugeChart`, `TreemapChart`, `RadarComponent`, `VisualMapComponent` and the rest, and no
bundler can drop them.

## The constraint that must survive the fix

The doc comment above `getEcharts` is correct, and it is the reason the code looks like this:

> `package.json` declares `"sideEffects": false`, so a bare top-level `echarts.use([...])` in a
> re-export-only module gets tree-shaken away. That leaves the canvas renderer unregistered and
> makes `init` throw `Renderer 'undefined' is not imported`.

**Registration must stay inside a called function.** Do not move `echarts.use([...])` to module
top level in a chart file. That reintroduces a bug someone already paid for.

## What to build

Make the module list a **parameter** rather than a constant. Registration stays inside a called
function, so the side effect survives; the list becomes per-family, so the payload shrinks.

1. In `echarts-init.ts`, keep the base set that every chart needs — `echarts/core`,
   `CanvasRenderer`, `GridComponent`, `TooltipComponent`, `LegendComponent` — and accept extras:

   ```ts
   export function getEcharts(extra: readonly unknown[] = []): typeof echarts {
     echarts.use([...BASE, ...extra]);   // echarts.use is idempotent; keep the guard per module set
     return echarts;
   }
   ```

2. Thread the list through `use-nq-echarts.ts`. Its current module-scope call is what forces one
   shared set. Each family passes its own list.

3. Each chart family declares only what it draws. The bar chart passes `[BarChart]`. The radar
   chart passes `[RadarChart, RadarComponent, PolarComponent]`. The calendar chart passes
   `[HeatmapChart, CalendarComponent, VisualMapComponent]`. Derive the rest from each family's
   compile module.

4. Keep `getEcharts()` working with no argument, so nothing outside the chart families breaks.

**Target: `@nqlib/nqchart/bar-chart` at or below 200 KB gzip.** That is the hand-picked echarts
number plus the library's own code. State the achieved number in the PR body.

## Guard it, the way `check:api` guards the surface

Add `pnpm run check:size`. It bundles each family entry with esbuild, gzips it, and compares
against a committed baseline file. It fails when an entry grows more than 5 percent. Run it
inside `build:npm`, after `check:api`. Without this, the payload creeps straight back — the same
reason the API drifted before 014.

---

# Finding 2 — `toDataURL({ type: "svg" })` cannot work

`src/registry/echarts-core/chart-handle.ts:24` passes the type straight through:

```ts
const type = opts?.type === "svg" ? "svg" : "png";
return instance.getDataURL({ type, pixelRatio: opts?.pixelRatio ?? 2, backgroundColor });
```

`ChartExportOpts.type` is declared `"png" | "svg"`. But `echarts-init.ts` registers only
`CanvasRenderer`. ECharts produces an SVG data URL only when the chart initialises with the SVG
renderer. **The type promises an output the renderer cannot produce.**

Verified: the renderer registration, in source and in the published bundle. Not verified: the
exact runtime failure. A canvas `toDataURL("image/svg")` is an invalid MIME type, so the browser
most likely falls back to PNG and returns a PNG silently. Confirm the actual behaviour in a
browser before you choose the fix.

Pick one, and say which in the PR body:

- **Narrow the type to `"png"`** and note the renderer limit in the doc comment. Smallest change,
  honest surface.
- **Register `SVGRenderer` on demand** when `type: "svg"` is requested. Larger, and it only works
  if the chart was initialised with that renderer, so it likely means a root-level `renderer`
  prop. That is a feature, not a fix — give it its own plan.

Take the first unless a consumer needs vector export today.

---

# Finding 3 — nine files import private echarts paths

```
src/registry/echarts-core/apply-rollout-intro.ts    echarts/lib/animation/basicTransition.js
src/registry/echarts-core/apply-rollout-intro.ts    echarts/lib/util/graphic.js
src/registry/echarts-core/pie-hover-focus.ts        echarts/lib/util/states.js
src/registry/echarts-core/funnel-hover-focus.ts     echarts/lib/util/states.js
src/registry/echarts-core/radial-hover-focus.ts     echarts/lib/util/states.js
src/registry/echarts-core/scatter-hover-focus.ts    echarts/lib/util/states.js
src/registry/echarts-core/treemap-hover-focus.ts    echarts/lib/util/states.js
src/registry/echarts-core/waterfall-hover-focus.ts  echarts/lib/util/states.js
```

These are not public API. `src/registry/echarts-core/echarts-internals.d.ts` declares them, so
the coupling is deliberate and understood. The risk is the peer range: `echarts: "^5.6.0"` admits
every future 5.x minor, and a private path can move in a minor release. A consumer on echarts
5.9 would then get a resolve error at build time, or a missing export at run time.

Do not remove the internals. They power the hover-focus behaviour and there is no public
equivalent. Instead, make the coupling loud:

1. Add `pnpm run check:internals`. It resolves each private path against the installed echarts
   and exits non-zero when one is missing. Run it inside `build:npm`. A build failure beats a
   consumer's runtime failure.
2. Document the coupling in `docs/architecture/public-surface.md`, with the list above and one
   sentence saying which echarts versions were verified. 5.6.0 is what is installed today.

While you are there: `echarts/lib/animation/basicTransition.js` and `echarts/lib/util/graphic.js`
are declared **twice**, in `echarts-internals.d.ts` and in `src/types/globals.d.ts`. Delete the
duplicates from one file.

---

# Boundaries

- **Do not commit this work order.** It sits untracked in the repo root. Plan 016 is the
  document that belongs in the repo. Delete this file when the PR merges.
- **Do not move `echarts.use([...])` to module top level.** `"sideEffects": false` will drop it.
  The bug it causes is `Renderer 'undefined' is not imported`, and it only appears in a consumer
  build, never in this repo's dev server.
- **Do not set `"sideEffects": true` to dodge Finding 1.** That disables tree-shaking for the
  whole package and makes the payload worse, not better.
- **Do not change any public prop.** `check:api` guards the surface; keep it green. This work is
  internal, apart from the `ChartExportOpts.type` narrowing in Finding 2.
- **Do not remove the private echarts imports.** Hover-focus depends on them and no public API
  replaces them.
- **Do not bundle echarts.** It is a peer dependency. Keeping it external is correct.
- **Do not touch `plans/009` to `plans/015`.** They are closed. Write plan 016.

---

# Definition of done

Branch `feat/016-echarts-payload`, PR into `main`, squash-merge.

Commit subject:

```
perf(charts): a chart entry registers only the echarts modules it draws — plan 016
```

These must all pass:

```bash
pnpm run build:npm     # build:lib + build:types + check:dist + check:api + your new checks
pnpm test
pnpm run lint
```

The PR body must contain:

- The before and after gzip size for **every** family entry, as a table. Before is the 0.3.0
  baseline; measure it, do not copy it from this document.
- The `check:size` baseline file, and the threshold you chose.
- Which option you took for Finding 2, and what the browser actually did with
  `type: "svg"` before you changed it.
- The output of `pnpm run build:npm`.
- Confirmation that `/bi-check` still works: click, legend, brush, empty, error, export.
- Any deviation from this document, argued in writing.

Docs to update in the same PR:

- `plans/016-*.md` — the plan, with status `DONE` and a closing date.
- `plans/README.md` — the new row.
- `docs/architecture/public-surface.md` — the echarts internals coupling.
- `src/content/docs/changelog.mdx` — a 0.3.1 entry.
- Bump `package.json` to `0.3.1`. **Do not publish.** The owner publishes.

---

# Who is waiting

SecoLab imports this library on three work-management screens today, and story ST-289 is
migrating its whole dashboard renderer onto `NQComposedChart` right now. That app is a Tauri
desktop bundle, so the 333 KB gzip lands in a shipped binary. The payload work in Finding 1 is
the difference between one chart library and two.
