# NQChart — Engine + Docs App Improvement Plan

> Principal-engineer + design-engineer review of the chart **engine** (`src/registry/**`) and the **docs/landing app** (`src/app/**`, `src/components/**`).
> Date: 2026-06-10 · Branch reviewed: `landing-redesign-and-theme` (f43ccf9)
> Status legend: `[ ]` todo · `[x]` done · each item lists files + acceptance criteria so it can be executed independently.

---

## Executive summary

**The engine is in strong shape.** Zero `any` casts, zero full-`echarts` imports (all `echarts/core` tree-shaken via `echarts-init.ts`), SSR-safe color resolution, a centralized animation token file (`chart-animation-tokens.ts`) with `prefers-reduced-motion` support, and zero Recharts remnants. No P0 correctness bugs found in the engine.

**The main debt is in four areas:**

1. **Engine maintainability** — 14-field `CompileRootFields` pass-through, ~800 lines of duplicated chart boilerplate, a 20+-optional-field `CompileContext` with no per-chart-type narrowing, and dead props (`isClickable`, `glowing`, `bufferBar`) on the public API.
2. **Docs/landing accessibility** — no `<h1>` on the landing page, no `prefers-reduced-motion` handling in the *UI layer* (CSS transitions + motion/react springs — the chart engine already handles it), missing aria labels on logo/preview SVGs, dark-mode button `opacity-90` contrast risk.
3. **Color token leakage** — ~135 hardcoded hex values, concentrated in examples/demos (`example-datasets.ts` 37, `dashboard-data.ts` 12) that users will copy-paste; duplicate canvas fallback palettes that can drift from `globals.css`; dark-mode chart palette hue swaps and a deuteranopia-risk pair (chart-1 275° vs chart-4 304°).
4. **Motion/spacing tokens stop at the engine boundary** — the engine has a token system; the UI layer has 7 ad-hoc durations (150/200/300/500/600/1200/1400ms), untokenized spring constants, pixel-perfect TOC math (`ITEM_HEIGHT = 26.28`), and landing section rhythm that drifts 64→80→96px.

**Recommended execution order:** Phase 1 (a11y quick wins, ~half day) → Phase 2 (token unification, ~1 day) → Phase 3 (engine refactors, ~2 days) → Phase 4 (docs/DX polish, ~1 day). Phases are independent; any can ship alone.

---

## Phase 1 — Accessibility & correctness quick wins (P1, ~half day)

### 1.1 Landing page has no `<h1>`
- **Files:** `src/app/page.tsx`
- Page goes Badge → `<NQChartWordmark>` (SVG) → `<p>`, then sections start at `<h2>`. Breaks document outline and SEO.
- **Fix:** add `<h1 className="sr-only">NQChart — Composable React charts for shadcn/ui</h1>` at the top of the hero (or wrap the wordmark in an `<h1>`).
- **Accept:** axe/lighthouse reports exactly one h1; heading levels don't skip.

### 1.2 `prefers-reduced-motion` for the UI layer
- **Files:** `src/app/globals.css`, `src/components/docs/mdx/components/toc-indicator.tsx`, `src/components/docs/sidebar/nav-main.tsx`, `src/registry/ui/loading-shimmer.tsx`
- The chart engine respects reduced motion (`chart-animation-tokens.ts:133`); CSS transitions and motion/react springs (TOC indicator, nav tree, shimmer) do not.
- **Fix:**
  - Add a global guard in `globals.css`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    ```
  - In motion/react components, use `useReducedMotion()` from `motion/react` and render the final state (or `transition={{ duration: 0 }}`) when true.
- **Accept:** with macOS "Reduce Motion" on, TOC indicator/nav tree jump instantly and shimmer is static.

### 1.3 Aria labels on logo + gallery SVGs
- **Files:** `src/components/landing/landing-header.tsx`, `src/components/landing/chart-gallery.tsx`, wordmark/mark components, `src/components/docs/svg-previews/*`
- **Fix:** `role="img" aria-label="NQChart"` on wordmark/mark; gallery preview SVGs get `aria-hidden="true"` (decorative — card text already names the chart type).
- **Accept:** VoiceOver announces header logo as "NQChart"; previews are silent.

### 1.4 Dark-mode button contrast (`opacity-90`)
- **Files:** `src/components/ui/enhanced-button.tsx` (~lines 35, 44, 53)
- `opacity-90 hover:opacity-100` on dark primary risks dropping label contrast below WCAG AA and makes default/hover hard to distinguish for low-vision users.
- **Fix:** replace with `dark:opacity-100 dark:hover:brightness-110` (or a border/shadow hover treatment). Verify with a contrast checker against the actual oklch values.
- **Accept:** measured contrast ≥ 4.5:1 in both states, both themes.

### 1.5 MCP route crashes on malformed JSON
- **Files:** `src/app/mcp/route.ts` (~lines 157–181)
- `await request.json()` is un-guarded; bad payload kills the tool endpoint.
- **Fix:** wrap in try/catch → return JSON-RPC `-32700 Parse error`.
- **Accept:** `curl -d 'not json' /mcp` returns a JSON-RPC error, not a 500.

### 1.6 ComponentPreview error fallback
- **Files:** `src/components/docs/charts/component-preview.tsx` (~lines 28–43)
- Inline red `<code>` on failure; no `role="alert"`.
- **Fix:** render an `<Alert role="alert">` with the component name and a hint ("run `pnpm registry:fresh`").
- **Accept:** broken `name=` in MDX produces an accessible, styled alert.

---

## Phase 2 — Token unification: color, motion, spacing (P1–P2, ~1 day)

### 2.1 Example/demo chart colors → token references
- **Files:** `src/registry/examples/example-datasets.ts` (37 hex), `src/components/landing/dashboard-data.ts` (12 hex), `src/registry/examples/example-shared.ts`, `ex-pie-chart.tsx`, `ex-bullet-chart.tsx`, `ex-gauge-with-target-chart.tsx`, `b-isometric-bar-chart.tsx`
- Examples hardcode Tailwind hexes (`#0ea5e9`, `#8b5cf6`, …). Users copy examples, so the token system is effectively invisible; rebrands require touching 37+ files.
- **Fix:** create `src/registry/examples/chart-tokens.ts` exporting `var(--chart-1)`…`var(--chart-5)` arrays (the engine's `createColorResolver` already resolves CSS vars via `getComputedStyle`); migrate example configs to it. Keep explicit hex only where the example *teaches* custom colors, with a comment.
- **Accept:** `rg '#[0-9a-fA-F]{6}' src/registry/examples src/components/landing` count drops from ~60 to < 10, all remaining ones commented as intentional.

### 2.2 Canvas fallback palette drift guard
- **Files:** `src/registry/echarts-core/resolve-chart-chrome.ts` (lines ~63–81)
- `CANVAS_LIGHT/DARK` (hex) duplicate `globals.css` tokens (oklch). Silent drift risk when the palette changes.
- **Fix (minimum):** comment each hex with the token it mirrors (`/* = --foreground oklch(0.145 0 0) */`). **Fix (better):** read once from `getComputedStyle(document.documentElement)` at first client use, hex map only as SSR fallback.
- **Accept:** every fallback value is traceable to a named token; changing `--foreground` doesn't leave charts stale.

### 2.3 Dark-mode chart palette review
- **Files:** `src/app/globals.css` (chart token blocks in `:root` / `.dark`)
- Three issues: (a) chart-3/chart-5 *change hue* between themes (blue→yellow, yellow→red) — sequential charts flip semantics on theme toggle; (b) dark chart-1 (275°) vs chart-4 (304°) are within deuteranopia confusion range; (c) dark chart-3 at L=0.769 pops vs the 0.58–0.65 cluster.
- **Fix:** keep hues stable across themes and adjust lightness/chroma only; move dark chart-4 ≥ 60° away from chart-1 (e.g. toward orange ~40° or cyan ~190°); pull dark chart-3 lightness to ~0.65. Validate with a colorblind simulator and document the palette rationale in a comment block.
- **Accept:** per-slot hue delta between themes ≤ ~15°; all dark pairs distinguishable under deuteranopia/tritanopia simulation; dark lightness spread within ~0.12.

### 2.4 UI motion tokens (extend the engine's pattern to the app)
- **Files:** new `src/globals/constants/motion.ts` (or extend `chart-animation-tokens.ts`); consumers: `tabs.tsx`, `enhanced-button.tsx`, `sheet.tsx`, `sidebar.tsx`, `component-preview-tabs.tsx`, `toc-indicator.tsx`, `nav-main.tsx`, `loading-shimmer.tsx`
- Today: 150/200/300/500/600/1200/1400ms scattered, spring constants inline (`stiffness: 200 - activeIndex * 10` in `nav-main.tsx:76`), tab icon spins at 500ms while everything else is 200ms.
- **Fix:** define a small set — `fast: 150`, `standard: 200`, `overlay: 300`, plus `SPRING = { stiffness: 180, damping: 20 }` — and consume everywhere. Specific changes:
  - `component-preview-tabs.tsx:56` icon `duration-500` → `duration-200`.
  - `nav-main.tsx` spring → constant `SPRING` (drop the per-index stiffness).
  - `loading-shimmer.tsx:49` `duration: 1.4` → `CHART_INTRO_DURATION_MS / 1000` (1.2s) so the skeleton loop matches the chart intro.
- **Accept:** `rg 'duration-(75|100|500|700|1000)' src/components src/registry/ui` returns only justified hits; one spring preset; shimmer = 1200ms.

### 2.5 Landing section rhythm
- **Files:** `src/app/page.tsx` (~lines 37–110)
- Sections drift `py-16` → `pt-20` → `py-24` (64/80/96px) with no rule.
- **Fix:** standardize on one rhythm — `pt-20` (80px) between sections, hero `py-20 sm:py-28`, final CTA `py-20`. Keep `max-w-6xl px-6` container as is (it's consistent).
- **Accept:** every landing `<section>` uses the same vertical spacing constants.

### 2.6 Tokenize structural magic values
- **Files:** `src/components/docs/mdx/components/api-reference.tsx` (10 arbitrary values), `sidebar.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `toc-indicator.tsx` (lines 7–14)
- Worst case: TOC math hardcodes `ITEM_HEIGHT = 26.28` px — breaks silently if typography/line-height changes.
- **Fix:** TOC indicator should measure actual item height on mount (`getBoundingClientRect` of the first `.toc-item`) instead of constants; remaining `w-[2px]` / `w-[100px]` / `ring-[3px]` either move into `@theme` variables or get a `/* deliberate: … */` comment. Don't over-tokenize one-offs — the goal is auditability, not zero arbitrary values.
- **Accept:** TOC indicator survives a font-size change without visual drift; arbitrary-value census in docs components halves.

---

## Phase 3 — Engine architecture refactors (P1–P2, ~2 days)

> No correctness bugs — these reduce friction before chart count grows past ~20. Do 3.1 → 3.2 in order; the rest are independent.

### 3.1 Collapse `CompileRootFields` into per-domain config objects
- **Files:** `src/registry/echarts-core/use-compiled-option.ts` (lines 36–105), `parts/types.ts` (`CompileContext`, lines ~262–293), all chart Canvas components
- 14 flat fields mirrored through `CompileContext` (20+ optionals); every new chart prop touches 4 places, and any compiler can read fields that are undefined for its chart type.
- **Fix:** group into `radialConfig`, `funnelConfig`, `layoutConfig` sub-objects (14 → ~6 root fields). Then introduce narrowed context types (`CartesianCompileContext`, `RadialCompileContext`, …) so compilers can't reference foreign fields.
- **Accept:** `useCompiledOption` dep list ≤ 8 entries; `tsc` fails if `compileGauge` reads `ctx.layout`.

### 3.2 `createCartesianChart` factory for chart boilerplate
- **Files:** `bar-chart.tsx`, `line-chart.tsx`, `area-chart.tsx`, `composed-chart.tsx` (+ scatter if it fits)
- Each repeats the same ~90–130-line shell: `PartRegistryProvider` → `ChartContainer` → `ChartPlotShell` → `useCompiledOption` → `EChartsHost` → `useChartBrush` footer. ~800 lines → ~200.
- **Fix:** `createCartesianChart(compileFn, { defaultLoadingPoints, defaultLayout })` factory; per-chart files keep only their compile fn, sub-components, and chart-specific hooks. **Constraint:** public API and registry output must not change — registry items still ship readable standalone source, so verify the built `public/r/*.json` payloads still compile standalone after the refactor (`pnpm registry:fresh` + spot-check).
- **Accept:** brush behavior fixed in one place; all chart examples render identically (visual spot-check of docs previews).

### 3.3 Remove or implement dead public props
- **Files:** `bar-chart.tsx` (~lines 324–365: `Bar` props `isClickable`, `glowing`, `bufferBar`; also audit `Dot`/`ActiveDot`)
- Recharts-era props accepted but never wired — users set them and silently get nothing.
- **Fix:** remove from signatures (preferred pre-1.0), or wire them through the parts system, or mark `@deprecated — no-op, planned v2`. Pick one policy and apply to all charts.
- **Accept:** every prop on every exported sub-component either has an effect or a `@deprecated` JSDoc; docs match.

### 3.4 Generalize hover-trace + monospace-fold hooks
- **Files:** `bar-chart.tsx` (lines ~86–88, 141–174), `use-monospace-collapse.ts`, hover-trace hook
- Both are hardcoded to the bar series (`NQ_HOVER_TRACE_SERIES_ID`), blocking reuse by radial-bar/composed.
- **Fix:** parameterize by `seriesId`/`dataKey` instead of bar constants.
- **Accept:** radial-bar can adopt hover-trace without copy-paste.

### 3.5 Memoize per-compile DOM reads
- **Files:** `apply-chart-chrome.ts` (`resolveCanvasChartChrome`), `use-compiled-option.ts` (lines ~46–49, `createColorResolver`)
- Both query the DOM on every compile (every data update; theme toggle triggers 17 compilers × N lookups).
- **Fix:** resolve chrome once per `chartId + themeTick` in `useCompiledOption` and pass via context; make `createColorResolver` cache per-key within an epoch.
- **Accept:** one `getComputedStyle` batch per chart per theme change (verify with a counter in dev).

### 3.6 Dev-mode `dataKey` validation
- **Files:** all compilers (e.g. `compile-bar.ts:109`), or a single check in the chart root
- `row[bar.dataKey] ?? 0` silently renders all-zeros on typos.
- **Fix:** `if (process.env.NODE_ENV === "development") validateDataKeys(data, parts)` → `console.warn` listing missing keys.
- **Accept:** `<Bar dataKey="revenueee" />` warns in dev; zero production cost.

### 3.7 Document engine conventions (cheap, high leverage)
- **Files:** all `compile-*.ts`, null-render compound components (`Grid`, `XAxis`, …), `compile-gauge.ts:7–17` radialBar fallback
- **Fix:** file-header JSDoc on compilers ("server-safe pure function — never touch document/hooks"); JSDoc on null-render components ("registers a part, renders nothing — compound API"); document or delete the gauge→radialBar compat fallback.
- **Accept:** a new contributor can't mistake compilers for client code or "fix" null-render components.

---

## Phase 4 — Docs app & DX polish (P2–P3, ~1 day)

### 4.1 Decide the `components/ui` story
- **Files:** `src/components/ui/` (54 files) vs `src/registry/ui/` (8 files)
- 53 shadcn primitives power the site but aren't registry-exported. This is **likely fine** — NQChart is a *chart* registry and shadcn users bring their own primitives — but it's currently ambiguous.
- **Fix:** explicit decision, documented in CONTRIBUTING.md: site-internal primitives stay in `src/components/ui` (document "bring your own shadcn"), and chart registry items must only depend on `src/registry/**` + published shadcn components. Add a lint/audit script check that no `src/registry/**` file imports from `src/components/**`.
- **Accept:** documented policy + automated boundary check passes.

### 4.2 Demo dashboard render hygiene
- **Files:** `src/components/landing/demo-dashboard.tsx` (257 lines, `RANGES` redeclared at ~line 113)
- **Fix:** hoist `RANGES`/config objects to module scope; rename the "Live demo" badge to "Interactive demo" (data is static). Optionally split the 4 chart sections into subcomponents.
- **Accept:** toggling range doesn't re-create config objects; badge no longer over-promises.

### 4.3 Package-manager switcher on install command
- **Files:** `src/components/landing/install-command.tsx`
- **Fix:** pnpm/npm/bun/yarn toggle (persist choice in localStorage; reuse if docs already have such a component).
- **Accept:** all four commands copyable.

### 4.4 OG images for chart doc pages
- **Files:** `src/app/docs/[[...slug]]/page.tsx` (metadata, ~lines 46–54), new `src/app/og/route.tsx`
- Most MDX pages lack `image:` frontmatter → blank social cards for a visual library.
- **Fix:** `next/og` (ImageResponse) route rendering title + the matching SVG preview from `src/components/docs/svg-previews/`; wire into `generateMetadata` as fallback.
- **Accept:** every docs URL renders a branded OG card.

### 4.5 Small docs fixes
- `src/components/docs/sidebar/header.tsx:12` — scope `pointer-events-none` to the backdrop, not the container wrapping interactive children.
- `component-preview-tabs.tsx:52` — responsive toolbar sizing (`size-9 sm:size-11`) for 320px viewports.
- Add `/docs/changelog` MDX + sidebar entry.
- Card spacing ladder: document the intended hierarchy (label `space-y-0.5` → content `gap-4` → sections `gap-6`) and align the landing cards to it.

---

## Explicitly NOT planned (reviewed and rejected)

- **Per-chart ECharts module registration** (`echarts-init.ts` registers all chart types): real bundle cost is modest (~100–150KB across unused chart modules) and per-entry registration complicates the registry's standalone-file story. Revisit if bundle complaints arrive; document as known limitation.
- **`--path` token removal**: flagged as unused by audit, but it *is* used (`text-path` in `toc-indicator.tsx:144`, `nav-main.tsx:42,50`). Keep.
- **CMS for landing demo data**: static data is appropriate for a library landing page.
- **Engine rewrite of any kind**: layering (echarts-core → compilers → charts → ui) is sound; 0 `any`, 0 full-echarts imports, SSR-safe. Keep the architecture.

## Verification checklist (run after each phase)

```bash
pnpm lint && pnpm exec tsc --noEmit   # quality gates (CI parity)
pnpm registry:fresh                    # registry payloads still build
pnpm audit:previews                    # all MDX previews resolve
pnpm build                             # full static build
```

Plus manual: light/dark toggle on landing + 2 chart docs pages, keyboard-tab through header/sidebar, macOS Reduce Motion on, 320px viewport spot-check.
