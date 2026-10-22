# Plan 018 — Headless render: pure compile path, theme registry, SVG in Node

- **Status:** TODO
- **Written:** 2026-10-21
- **Effort:** L · **Risk:** med
- **Skills:** `nqchart-dev`
- **Epic:** [EP-007](../docs/product/epics/EP-007-headless-render/epic.md)
- **Stories:** [ST-024](../docs/product/epics/EP-007-headless-render/stories/ST-024-pure-compile-path-and-theme.md) · [ST-025](../docs/product/epics/EP-007-headless-render/stories/ST-025-headless-entry-and-svg-render.md) · [ST-026](../docs/product/epics/EP-007-headless-render/stories/ST-026-release-0-4-0.md)
- **Base:** `main` at `a92af62`. All line numbers in this plan are against this commit.

## Why

`@nqlib/nqchart@0.4.0` renders a composed or a pie chart to an SVG string in Node, with a
registered theme, from the same compile path as the browser. The consumer secolab exports
dashboards to PDF (plan page 2370, SECO-1470). Its export draws charts with matplotlib from
copied rules, and the output drifts from the desktop charts. ECharts 5.3+ renders an SVG
string in Node with `init(null, null, { renderer: "svg", ssr: true })` and no browser. The
nqchart compilers are pure already. This plan adds the missing parts: an export surface, a
theme that the caller injects, and a legend that is not HTML.

## Scope — In

- `src/registry/echarts-core/`, `src/registry/headless/` (new), `src/registry/charts/` (four
  files), the build scripts, `package.json`, docs, the consumer skill.
- Specs S6.1–S6.3 ([`docs/product/specs.md`](../docs/product/specs.md)).

## Scope — Out

- **Do not touch** the browser option for a consumer with no registered theme, except the
  two fixes (Approach parts 3 and 4). The pie and line snapshots prove it.
- **Do not** change a helper's signature where a `chartId` already reaches it; the registry
  is keyed by chart id for that reason. `applyChartAnimationToOption` is the one exception,
  and it is internal.
- **Do not** register `SVGRenderer` in `echarts-init.ts` or add a `renderer` prop to a chart
  root (plan 016 Scope Out). The SVG renderer lives in the headless entry only.
- **Do not** bundle echarts; it stays a peer and an external in `vite.lib.config.ts:73-81`.
- **Do not** set `sideEffects: true` or move `echarts.use` to module scope
  (`echarts-init.ts:22-36`).
- **Do not** mark react, react-dom or motion optional peers in this plan (EP-007 follow-up
  story).
- The browser-side `renderToSVGString` export (EP-007 follow-up story); ECharts 6 (EP-006);
  any new chart family.

## Approach

The mechanism. The compilers are pure already and run under vitest's `node` environment. Three things stop a Node caller from getting the browser's option: a value import of React through `echarts-tooltip.ts:2`; the DOM-guarded helpers that fall to fixed defaults instead of the consumer's theme; and `hideBuiltInLegend`, which assumes an HTML legend under the plot. A fourth thing stops the render: only `CanvasRenderer` is registered. The plan adds a theme registry keyed by chart id, a headless entry, a print legend and an SVG render helper, and ports two secolab workarounds upstream. Nothing a browser consumer sees changes, except the two fixes.

1. **The React import leaves the compile path.** Create `src/registry/echarts-core/config-colors.ts` and move `getColorsCount` (`src/registry/ui/chart.tsx:207-215`) into it as a named export. `ui/chart.tsx` imports it from there and keeps it in its own export list (:225) so the public surface does not move. `echarts-tooltip.ts:2` imports from `./config-colors`. Add a build-time check in `scripts/check-internals.mjs`: `grep -rl "from \"react\"" src/registry/echarts-core/*.ts src/registry/headless/` is empty, and `dist/headless.mjs` holds no `from "react"` or `require("react")`. Invariant for a code comment at the top of `config-colors.ts`: "The compile path imports no React module; a Node consumer runs it with no DOM."
2. **The headless theme registry.** Create `src/registry/echarts-core/headless-theme.ts`:

   ```ts
   export type HeadlessTheme = {
     isDark: boolean;
     chrome: { foreground: string; background: string; muted: string; border: string;
               splitLine: string; popover: string; popoverForeground: string };
     tones: { neutral: string; accent: string; positive: string; warning: string; critical: string };
     tokens?: Record<string, string>;  // "--metric-plan" -> "#1d4ed8"; resolves var() in config colors
     radiusPx: number | null;          // the value of --radius in px, null for the default
     fontFamily: string;
     animation: boolean;
   };
   const registry = new Map<string, HeadlessTheme>();
   export function headlessThemeOf(chartId: string): HeadlessTheme | undefined { return registry.get(chartId); }
   export function withHeadlessTheme<T>(chartId: string, theme: HeadlessTheme, fn: () => T): T {
     registry.set(chartId, theme);
     try { return fn(); } finally { registry.delete(chartId); }
   }
   ```

   Invariant for a code comment: "The chart id is the key to the chart's theme, in the DOM (`[data-chart=id]`) or in the headless registry. A helper reads the registry only where it reads the DOM today." Each guarded branch reads the registry before its fallback:
   - `resolve-chart-colors.ts:19-38` `resolveCssColorValue(value, contextEl)`: with no `document`, resolve a `var(--x)` chain through the tokens; the function takes no `chartId` today, so `createColorResolver` (:46) passes the theme's tokens into it (add an optional third parameter `tokens?: Record<string,string>`). `createColorResolver`'s headless branch (:57-60) resolves each `config[key].colors.light[i]` through the tokens. `resolveAreaFillColor` (:98-114): with a theme and `isDark === false`, pick the `dark` slot as the browser does.
   - `resolve-chart-chrome.ts`: `resolveChartChrome` (:40-63), `resolveChartFontFamily` (:73-90), `resolveCanvasChartChrome` (:146-167), `resolveCanvasTileLabelColor` (:134-139) read `headlessThemeOf(chartId)` first. `resolveCanvasChartChrome` returns the theme's `chrome` as given; it must not call `cssColorToCanvasRgb` (:114-126), which needs a DOM.
   - `chart-corner-radius.ts:54-81` `readBaseRadiusPx(chartId)`: return `theme.radiusPx` when a theme is registered.
   - `reference-marks.ts:20-38` `resolveToneColor(tone, chartId)`: return `theme.tones[tone]`.
   - `color-alpha.ts:63-74` `isDarkTheme(chartId?)`: return `theme.isDark`. Where the caller has no chart id, keep the fallback.
   - `apply-chart-chrome.ts:123` and `sliderTrackColors` (:121-141): the dark check reads the theme.
   - `apply-chart-animation.ts:195-240`: when `headlessThemeOf(chartId)?.animation === false`, set `animation: false` and no per-series durations. `applyChartAnimationToOption` takes the option only; add the `chartId` parameter and pass it from `apply-chart-ui.ts:24`.
   Test `headless-theme.test.ts`: with a theme registered, `compileComposedOption(makeCtx(...))` holds the theme's font, foreground, split line and tone colours, `animation: false`, and a `var(--metric-plan)` colour resolved to its token; without a theme the existing snapshots are unchanged.
3. **The stacked-bar corner roles in the composed chart.** Port `frontend/patches/@nqlib__nqchart@0.3.2.patch` (secolab, 71 lines) into `compile-composed.ts`: group the bar parts by `stackId`, compute the roles with the function `compile-bar.ts:40` already uses (`groupStackRoles`; move it to `bar-radius.ts` as an export if it is file-private), and give each stacked bar's data points their own `itemStyle.borderRadius` so only the outer corner of each stack rounds. An unstacked bar keeps `itemStyle.borderRadius` on the series. Test in `compile-composed.test.ts`: two bars on one stack over three rows; the top segment of each row rounds at the top, the bottom segment at the bottom, and a row where the top series is null hands the top role to the other series.
4. **Reference marks render in the browser too.** In `src/registry/charts/bar-chart.tsx`, `line-chart.tsx`, `area-chart.tsx` and `composed-chart.tsx`, add `MarkLineComponent` and `MarkAreaComponent` (from `echarts/components`) to the family's module list. Write the fix note `.agents/skills/fixed/<slug>.md` and its index row: "ReferenceLine compiled to a markLine but no family registered MarkLineComponent (seen by secolab, SECO-1289)." `pnpm skill:validate` must pass. If `check-size` reports growth over 5 % for a family, run `node scripts/check-size.mjs --write` and say so in the PR body with the two numbers.
5. **The headless entry.** Create `src/registry/headless/index.ts` that exports: every `compile*Option` function, `buildAreaSeries`, `withLegendFocus` (`legend-focus.ts`), `createColorResolver`, `withHeadlessTheme`, `headlessThemeOf`, the types `HeadlessTheme`, `CompileContext`, `ChartPart` and every part type, `ChartConfig`, `CHART_TYPOGRAPHY`, `CHART_FONT_FAMILY_FALLBACK`, and the two new functions below. No React import anywhere under `src/registry/headless/` (the check of part 1).
6. **The print legend.** `src/registry/headless/print-legend.ts`, `printLegend(ctx, legend: LegendPart | undefined, option) -> EChartsOption`: when `legend` is undefined or `legend.hide`, return the option as given (no legend). Otherwise set `option.legend = { show: true, bottom: 0, left: align, icon: "roundRect", itemWidth: 12, itemHeight: 12, textStyle: { fontSize: CHART_TYPOGRAPHY.axis.fontSize, color: chrome.muted }, data: [...] }` where `align` maps `left|center|right`, and `data` lists each series with `showInLegend !== false` in part order; a line series entry carries no `icon` key so ECharts draws its own line style (dashed and dotted included); a bar or an area entry carries `icon: "roundRect"`. Raise `grid.bottom` by 28 px so the plot leaves room, the way the HTML legend takes height under the plot. Invariant for a code comment: "The print legend tells the mark: a block for a bar or an area, the line in its own style for a line (secolab SECO-1508)."
7. **The SVG render.** `src/registry/headless/render-to-svg.ts`:

   ```ts
   import * as echarts from "echarts/core";
   import { SVGRenderer } from "echarts/renderers";
   import { GridComponent, LegendComponent, MarkLineComponent, MarkAreaComponent, DataZoomComponent } from "echarts/components";
   import { BarChart, LineChart, PieChart, CustomChart } from "echarts/charts";
   export function renderToSvg(option: EChartsOption, opts: { width: number; height: number; modules?: readonly unknown[] }): string {
     registerOnce([SVGRenderer, GridComponent, LegendComponent, MarkLineComponent, MarkAreaComponent, DataZoomComponent, BarChart, LineChart, PieChart, CustomChart, ...(opts.modules ?? [])]);
     const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: opts.width, height: opts.height });
     try { chart.setOption({ ...option, animation: false, tooltip: { show: false } }); return chart.renderToSVGString(); }
     finally { chart.dispose(); }
   }
   ```

   `registerOnce` follows `echarts-init.ts:37-44` (a called function, a `Set` by module identity; the comment there says why `sideEffects: false` forbids a top-level `echarts.use`). The option's `backgroundColor` stays `transparent`; the consumer paints its own page.
8. **The build.** `vite.lib.config.ts`: `entry.headless = src/registry/headless/index.ts`. `tsconfig.lib.json` `include`: add `src/registry/headless`. `package.json` `exports`: `"./headless": { "types": "./dist/types/registry/headless/index.d.ts", "import": "./dist/headless.mjs", "require": "./dist/headless.cjs" }`. `scripts/build-types.mjs`: add `dist/types/registry/headless/index.d.ts` to the required list. `scripts/check-size.mjs`: generalise the entry list to `[...families, "headless"]` with a path map, then `node scripts/check-size.mjs --write` once to add the baseline; `platform: "node"` for the headless entry. `scripts/smoke-dist.mjs` `CHECKS`: `{ entry: "headless", expect: ["compileComposedOption", "renderToSvg", "withHeadlessTheme"] }` plus one real render: build a three-row composed context with one bar and one dashed line, register a theme, compile, `printLegend`, `renderToSvg` at 640×300, and assert the string starts with `<svg`, holds `stroke-dasharray`, holds the theme's foreground hex and holds the legend text. `scripts/check-api.mjs`: a probe file that imports `renderToSvg` and `compileComposedOption` from `@nqlib/nqchart/headless` and type-checks. `scripts/verify-publish.mjs`: add `dist/headless.mjs`, `dist/headless.cjs`, `dist/types/registry/headless/index.d.ts` to the required files.
9. **Tests.** `src/registry/headless/__tests__/render-to-svg.test.ts`: the same render as the smoke, from source; plus a pie render (donut 55 %) that holds the slice colours. `print-legend.test.ts`: the icon rule and the hidden-series rule. Update the pie and line snapshots only where the theme changes them, and say which keys moved in the PR body.
10. **Docs and release.** `docs/architecture/public-surface.md`: the entry row. `src/content/docs/changelog.mdx`: `## 0.4.0 — <date>` with the entry, the theme registry, the composed stacked corners, the MarkLine registration. `skills/consumer/nqchart/headless.md` (new, the consumer recipe: register a theme, compile, print legend, render) and `pnpm sync:skills`. `package.json` version `0.4.0`. `plans/018-headless-render.md` Status `DONE`, the three stories `done`, EP-007 stays `in-progress` until secolab lands. Run `pnpm run build:npm` and `pnpm verify:publish`; tag `git tag -a v0.4.0 -m "nqchart 0.4.0 — headless render"` and push the tag. Hoang runs `pnpm publish:npm`.

Notes. The size check runs esbuild with `platform: "browser"` for families; the headless entry is built with `platform: "node"` and is not compared with a family. If `pnpm publish:npm` asks for an OTP, that is Hoang's step.

## Acceptance

ST-024 — pure compile path and the headless theme registry:

- [ ] `echarts-tooltip.ts` imports no React module.
- [ ] A theme registered with `withHeadlessTheme(chartId, theme, fn)` is read by every helper that reads `[data-chart]` today (the list is in Approach part 2).
- [ ] A composed stacked bar rounds only its outer corners (the port of secolab PR #1387).
- [ ] The bar, line, area and composed families register `MarkLineComponent` and `MarkAreaComponent`.
- [ ] The vitest suite passes in the `node` environment.

ST-025 — headless entry and the SVG render:

- [ ] The entry exists in `package.json` `exports`, `vite.lib.config.ts` and `tsconfig.lib.json`.
- [ ] `renderToSvg(option, {width, height, modules})` returns a string that starts with `<svg`.
- [ ] `printLegend(ctx, legendPart)` puts an ECharts legend in the option with a block icon for a bar or an area series and the line's own style for a line series.
- [ ] `smoke-dist.mjs` renders one composed chart to SVG from the built `dist/headless.mjs` and from `dist/headless.cjs`.
- [ ] `check-size` has a baseline for the entry.
- [ ] `check-api` type-checks a headless call.

ST-026 — release 0.4.0:

- [ ] `package.json` version `0.4.0`.
- [ ] `changelog.mdx` entry.
- [ ] `docs/architecture/public-surface.md` lists the entry.
- [ ] `skills/consumer/nqchart/` has a headless page and `pnpm sync:skills` ran.
- [ ] `pnpm run build:npm` and `pnpm verify:publish` pass.
- [ ] Tag `v0.4.0` pushed.
- [ ] Hoang runs `pnpm publish:npm`.

Checks that prove the criteria:

- [ ] `pnpm run audit:previews` and `pnpm run audit:registry-boundary` exit 0.
- [ ] `pnpm skill:validate` exits 0 and `git diff --exit-code .agents/skills/nqchart` is empty after `pnpm sync:skills`.
- [ ] `node scripts/smoke-dist.mjs` prints the headless render check as passed.
- [ ] From a scratch package that installs the packed tarball, `node -e "import('@nqlib/nqchart/headless')"` prints no error, and a script in it renders a composed chart to `out.svg` with two series, a dashed line and a legend.
- [ ] `git grep -n "from \"react\"" src/registry/headless src/registry/echarts-core/*.ts` prints nothing.
- [ ] `npm view @nqlib/nqchart version` prints `0.4.0` after Hoang publishes.

Gates:

- [ ] Verification gates from `docs/product/ai-contract.md` pass for touched surfaces
- [ ] Consumer skill updated if public API changed (`pnpm sync:skills`)
- [ ] Bug? → `.agents/skills/fixed/` note if non-trivial regression risk (the MarkLine registration, Approach part 4)

## Out of scope / follow-ups

- Optional peers (`peerDependenciesMeta`) for react, react-dom and motion, for Node-only consumers (EP-007 follow-up story).
- The browser-side `renderToSVGString` export (EP-007 follow-up story).
- ECharts 6 (EP-006).
- Other chart families in the headless render. Heatmap and waterfall can use the same entry in a later plan.
