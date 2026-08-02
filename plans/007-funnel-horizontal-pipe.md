# Plan 007 — Funnel: horizontal orient + smooth pipe connections

- **Status:** DONE
- **Written:** 2026-08-01
- **Effort:** L · **Risk:** med (custom geometry + hover parity)
- **Skills:** `nqchart-dev` / `nqchart-docs` / (hover) `fixed` if pipe path needs blur repair

## Why

Recruiting / CRM dashboards often show conversion as a **left→right pipe** with **S-curve joins** and a small turn radius (reference: job-progression horizontal funnel). Today `NQFunnelChart` only compiles a **vertical** ECharts `type: "funnel"` with straight trapezoid edges. `connection` only controls gap/border — not curved joins.

ECharts already supports `orient: "horizontal"` for native funnel. The pipe look does **not** exist in native funnel and needs custom path geometry.

## Scope — In

### Phase A — Horizontal native funnel (S)

- Public `orient?: "vertical" | "horizontal"` on `NQFunnelChart` and/or `<Stages />` (prefer root + style part, same pattern as `connection` / `taper`).
- Compiler: pass `orient`, set `funnelAlign` to `"center"` (or `"top"` / `"bottom"` when horizontal — never `"left"` / `"right"` when horizontal; ECharts bug #15094).
- Label defaults: inside labels stay usable; document outer-label caveats for horizontal.
- Vitest: assert `orient` in compiled series; seam/gap presets unchanged.
- Docs: fix stale funnel MDX that claims “bar series” / no funnel primitive; add horizontal example + API row.
- Consumer skill (`skills/consumer/nqchart/` → `pnpm sync:skills`): mention `orient` on Funnel section.

### Phase B — Smooth pipe connections (M–L)

- New visual mode for continuous pipe with cubic-bezier stage transitions and configurable small turn radius.
- Prefer extending the funnel primitive (not a new chart family): e.g. `connection="pipe"` **or** `shape="pipe"` on `<Stages />` — pick one name in implementation; avoid boolean proliferation.
- When pipe mode is on:
  - Compile via `type: "custom"` `renderItem` (precedent: monospace bar) — one series, N stage polygons/paths filled with stage colors.
  - Geometry: horizontal centerline; each stage half-height ∝ value; between stages, short cubic Beziers on top/bottom edges (radius ≈ control-point inset along flow axis).
  - Symmetry about the horizontal center axis (reference look).
  - Keep `chartConfig` colors / tooltip trigger item / legend keys.
- Hover: reuse or adapt `repairFunnelHoverFocus` for custom graphic els (or document if native blur is enough); add/adjust `fixed` note if non-trivial.
- Example: `ex-funnel-pipe-chart` (or horizontal pipe) on funnel `static.mdx`.
- Unit tests for layout helpers (path points / radius clamp) — pure functions, no canvas.

## Scope — Out

- Callout boxes / “Explore” buttons on stages (product UI, not chart primitive).
- Retention % annotations as a first-class API (can follow as label formatter / graphic helper later).
- ~~Vertical pipe (S-curves top→bottom)~~ — shipped: `connection="pipe" orient="vertical"`.
- Sankey series substitution (wrong semantics).
- Decorative box-glow on labels/chips (`no-box-glow`).

## Approach

### Key files

| Area | Files |
|------|--------|
| API | `src/registry/charts/funnel-chart.tsx` |
| Types | `src/registry/echarts-core/parts/types.ts` (`FunnelOrient`, pipe connection/shape) |
| Layout | `src/registry/echarts-core/funnel-layout.ts` (+ new `funnel-pipe-geometry.ts` in Phase B) |
| Compile | `src/registry/echarts-core/compile-funnel.ts` |
| Hover | `src/registry/echarts-core/funnel-hover-focus.ts`, `use-nq-echarts.ts` wiring |
| Tests | `src/registry/echarts-core/__tests__/compile-funnel.test.ts` (+ pipe geometry tests) |
| Examples | `src/registry/examples/ex-doc-charts.tsx` / `registry-doc-examples.ts` |
| Docs | `src/content/docs/funnel-chart/static.mdx` |
| Skill | `skills/consumer/nqchart/components.md` (+ examples.md if new `ex-*`) |

### Phase A compiler sketch

```ts
orient: style?.orient ?? ctx.funnel?.orient ?? "vertical",
funnelAlign: orient === "horizontal" ? "center" : "center",
// layout box: horizontal may prefer taller height / less top padding — tune in impl
```

### Phase B geometry sketch

For stages `i = 0..n-1` with values `v[i]`, plot width `W`, height `H`, turn radius `r` (px, clamped):

1. Stage column width ≈ `(W - gaps) / n` (or proportional to duration — default equal width).
2. Half-height `h[i] = (v[i] / vMax) * (H/2) * (1 - minSizePad)`.
3. At column boundaries, top edge goes from `yCenter - h[i]` to `yCenter - h[i+1]` via cubic with control points inset by `r` along x; mirror for bottom.
4. Close path per stage (or continuous ribbon with per-stage fill splits at mid-transition) so hit-testing stays per stage.

Default `r` small (e.g. 8–16px) to match “small radius as it turns”; expose as optional `turnRadius?: number` on style part.

### API shape (proposed)

```tsx
<NQFunnelChart orient="horizontal" data={…} config={…}>
  <Stages connection="pipe" turnRadius={12} />
  <Tooltip />
</NQFunnelChart>
```

- `orient` works with native trapezoid funnel (`connection` seamless/default/segmented).
- `connection="pipe"` implies custom series; if combined with `orient="vertical"`, either no-op to horizontal pipe or reject — **v1: pipe is horizontal-only**; vertical + pipe falls back to seamless trapezoid with console-free documented default.

### Docs debt (same PR as Phase A)

`static.mdx` incorrectly says the funnel is a bar series / ECharts has no funnel primitive. Correct to `series-funnel` and link ECharts funnel option docs.

## Acceptance

### Phase A

- [ ] `orient="horizontal"` renders left→right trapezoid funnel in docs preview
- [ ] Default remains vertical (no visual regression on `ex-funnel-chart`)
- [ ] Compiler tests cover orient + existing seam presets
- [ ] MDX API + usage updated; stale bar-series prose fixed
- [ ] Consumer skill updated + `pnpm sync:skills`
- [ ] Verification gates from `docs/product/ai-contract.md` for touched surfaces

### Phase B

- [ ] Pipe mode matches reference intent: continuous ribbon, S-curve joins, small turn radius, center symmetry
- [ ] Per-stage color, tooltip, and hover dim still work
- [ ] Geometry helpers unit-tested (radius clamp, monotonic stage order)
- [ ] Example on funnel doc page; skill examples index updated
- [ ] If hover repair needed for custom series → `fixed` note + index rows
- [ ] Same verification gates

## Out of scope / follow-ups

- Retention % labels between stages (graphic/label API).
- Gradient fill along the pipe (reference uses light→dark blue); stage solid colors first, optional later.
- Animation intro for pipe paths (motion parity with trapezoid funnel).
- Vertical pipe orientation.

## Execution order

1. Land Phase A alone if we want a fast shippable PR.
2. Phase B in the same or follow-up PR once geometry is reviewed against the reference image.

**Ask before coding:** confirm shipping **A+B in one PR** vs **A first, B second**. Default recommendation: **one plan, two PRs** (A then B) so horizontal lands without blocking on custom paths.
