# Layer model — compound · compile · host (CCH)

**What the codebase actually is**, as built. Three layers every chart family is made of,
where each lives, and the rules that keep them apart.

> **Design rationale:** [[product/philosophy]]. **Public contract:** [[product/specs]].
> This document records the *shape as implemented* so it stays true after plans archive.

## The rule, in four lines

1. **Compound** — the React face. Roots and children consumers compose. No ECharts option
   objects leak here.
2. **Compile** — pure functions. Parts + data → `EChartsOption`. No hooks, no `document`.
3. **Host** — the canvas runtime. Init, resize, events, intro lock, plot insets, a11y shell.
4. **Recipes before new roots** — a BI synonym (histogram, Pareto, gauge) is data prep + an
   example on an existing primitive, not a new chart module.

If a change teaches the host a department word, or teaches a compiler about React state, it
is in the wrong layer.

---

## 1 · Compound — the public face

Location: `src/registry/charts/*.tsx` (+ shared parts in `echarts-core/chart-parts.tsx`).

| Concern | Where |
|---------|--------|
| `NQBarChart`, `NQComposedChart`, … | `charts/<family>-chart.tsx` |
| Child registrars (`Bar`, `YAxis`, `ReferenceLine`) | same file, or re-export |
| Cartesian boilerplate (brush, empty/error, a11y) | `create-cartesian-chart.tsx` |
| Legend / tooltip / background UI | `src/registry/ui/` |

Disciplines:

- **Compose, don't boolean.** No `isGauge` on a mega chart — use `NQRadialChart` + recipe.
- **Register, don't render.** Axes and series return `null` and call `useRegisterPart`.
- **One escape hatch.** `onChartReady` / `chartRef` are unsupported surface; prefer typed
  props (`onMarkClick`, axis formatters, …).

## 2 · Compile — the mechanism

Location: `src/registry/echarts-core/compile-*.ts`, `parts/types.ts`, `cartesian-axes.ts`,
`reference-marks.ts`, `apply-chart-ui.ts`.

| Concern | Where |
|---------|--------|
| Part union + `CompileContext` | `parts/types.ts` |
| Per-family option builders | `compile-bar.ts`, `compile-composed.ts`, … |
| Shared axis / dual-Y / tick formatters | `cartesian-axes.ts` |
| Reference lines & bands | `reference-marks.ts` → `markLine` / `markArea` |
| Animation + chrome + tooltip | `apply-chart-ui.ts` |

Two properties worth knowing before you touch it:

- **Compilers are pure.** Vitest runs them without a browser. DOM color reads happen in
  hooks (`useCompiledOption`, `resolveChartChrome`) on the client only.
- **Parts are the vocabulary.** Adding a public child means a `ChartPart` variant + a
  compiler branch — not an ad-hoc option merge in the React tree.

## 3 · Host — the runtime

Location: `use-nq-echarts.ts`, `echarts-host.tsx`, `chart-plot-shell.tsx`,
`use-chart-interaction.ts`, `use-keyboard-mark-nav.ts`, `chart-a11y.tsx`.

| Concern | Where |
|---------|--------|
| Init / dispose / resize / intro lock | `use-nq-echarts.ts` |
| Click → `NQMarkEvent` | `nq-mark-event.ts` + `use-chart-interaction.ts` |
| Keyboard mark nav (arrows / Enter) | `use-keyboard-mark-nav.ts` |
| Empty / error / sr-only table | `chart-plot-shell.tsx` + `chart-a11y.tsx` |
| Export | `chart-handle.ts` (`toDataURL`) |
| Hover-focus repairs (scatter, treemap, …) | `*-hover-focus.ts` |

The host may know about ECharts quirks. It must not invent a second public API that
bypasses the compound layer.

## 4 · Site vs product

| Path | Layer | Ships to consumers? |
|------|-------|---------------------|
| `src/registry/**` | compound + compile + host | **Yes** |
| `src/lib/public.ts` | re-exports | **Yes** (npm root) |
| `src/components/**` | docs site | **No** — registry must not import |
| `src/content/docs/` | public MDX | published site only |
| `docs/` | maintainer vault | no |

Boundary check: `pnpm run audit:registry-boundary`.

## 5 · Mapping to SecoLab EPS

SecoLab's **engine · profile · screen** is the same idea with different nouns:

| SecoLab EPS | NQChart CCH |
|-------------|-------------|
| Engine | Compile (+ host runtime) |
| Profile | `ChartConfig` + registered parts (data vocabulary) |
| Screen | Compound roots the consumer composes on a board |

Do not force EPS folder names into this repo — CCH matches the files that exist.

## Related

- [[architecture/system]] · [[architecture/dependency-rules]] · [[architecture/public-surface]]
- [[engine/compile-context]] · [[registry/chart-catalog]]
