# Plan 020 — Chart signature: one shape language + one focus mode (+ rose pie)

- **Status:** IN-PROGRESS — approved 2026-11-06; Phases A + B done, Phase C next
- **Written:** 2026-11-06
- **Effort:** L · **Risk:** med (visual change on every chart; hover regressions have a history)
- **Skills:** `nqchart-dev` / `nqchart-docs` / `fixed`
- **Story:** [ST-027](../docs/product/epics/EP-003-chart-craft/stories/ST-027-chart-signature.md)

## Why

A user flipping between NQChart charts should recognise one product: Apple/Linear calm —
soft continuous corners, honest hairline gaps, nothing jumps on hover. Today every family
decides its own shape and focus behaviour. An audit of all 18 compilers (2026-11-06) found:

**Shape**
- Three radius scales on rectangular marks: bars 3 (`--radius-sm`), treemap/radial 5
  (`--radius-md`), tiles 2 (literal), rounded funnel 14 (literal). Pie, heatmap, calendar,
  gauge, monospace bar: 0.
- No shared gap token. Pie has no `padAngle`; heatmap cells touch; treemap uses 3 inside / 4 at
  root; tiles 2; segmented funnel 12; stacked bars no separator (`stackSegmentGapStyle` is a
  no-op).
- Separators are sometimes real space, sometimes a painted `gapColor` border, and treemap/funnel
  borders are set twice (compiler + `apply-chart-chrome`).
- Strokes drift: line 2, area 1.5, composed 2→3 on hover; symbols 4 / 5 / 8 / 14; glow blur
  14 vs 16; radar glow has no `shadowColor`. Gauge is the only arc without round caps.
- Several compilers bypass `resolveCartesianGrid` (tile-column, calendar).

**Focus**
- Two dim levels: hover `0.2`, legend `0.16`.
- Hovered mark sometimes grows (composed line, area-glow, monospace) or recolours (bar →
  flat colour, which breaks hatched/gradient bars).
- State timing: half the families force `stateAnimation 0`, the rest use ECharts default;
  radar/scatter miss `withInstantFocusUpdate` and keep a 350 ms tween.
- Labels dim on some charts but not others (pipe/rounded funnel labels, radial ring names,
  rose leader labels never dim).
- Keyboard focus sends native `highlight`, which the five repair families disabled → keyboard
  focus is invisible on pie, funnel, treemap, waterfall, radial; waterfall targets the silent
  placeholder series. No keyboard on radial, radar, heatmap, calendar, treemap, tile-column.
- Five near-identical repair modules with two schedulers (microtask vs double rAF); scatter's
  double-rAF repair can re-blur after the pointer leaves.

And a new chart is requested: a **rose pie** (angle *and* radius ∝ value, rounded slices,
hairline pad, small hole, sorted descending clockwise from 12 o'clock).

## Signature — the spec (what every chart will follow)

One module `src/registry/echarts-core/chart-signature.ts` replaces scattered literals.
Values derive from the existing `--radius` CSS variable (0.45rem = 7.2 px default) and a new
`--chart-gap` variable, so a host theme moves the whole system at once (live via the container,
headless via `headless-theme`).

| Token | Value (default theme) | Used by |
|-------|----------------------|---------|
| `radius.mark` | `--radius-sm` → 3 px | bars, waterfall, stacked outer corners, tiles, heatmap & calendar cells, monospace bar, hover-trace pill |
| `radius.surface` | `--radius-xl` → 11 px | pie / donut / rose slices, treemap tiles, rounded funnel outer corners, legend-free large marks |
| `radius.join` | = `radius.mark` (3 px) | corners where two marks of one shape meet (funnel inner corners, stack seams) |
| caps | round | every arc: radial, rose bar, gauge |
| `gap.seam` | `--chart-gap` → 2 px | between adjacent marks of one whole: pie/donut/rose pad, treemap, heatmap, calendar, tiles, stacked segments |
| `gap.stage` | 4 × seam → 8 px | between stages: funnel (rounded, cone, segmented) |
| `bar.categoryGap` / `bar.groupGap` | `28%` / `8%` | bar, composed, waterfall, histogram stays 0 |
| `stroke.line` | 2 px (never grows) | line, area, composed, radar, sparkline |
| `stroke.halo` | 2 px in canvas background | point markers on line/area/composed |
| `symbol.point` / `symbol.scatter` | 6 / 8 px (bubble scales) | line, area, composed, radar / scatter |
| `glow` | blur 14 + series colour | area/radar/scatter glow variants |

Rules: **real space over painted seams** (pie `padAngle` converted from px at the outer radius,
treemap `gapWidth`, custom-series insets); paint a background-coloured border only where ECharts
has no geometric gap (heatmap, calendar), and only in one place (the compiler — remove the
`apply-chart-chrome` re-injection). Radius is always clamped to half the mark's short side so
thin bars and tiny slices never balloon.

### Focus mode — one behaviour

| | Signature |
|---|---|
| Dim | `FOCUS.dim = 0.2` for hover **and** legend isolate |
| Hovered mark | unchanged: no scale, no width growth, no recolour (keeps pattern/gradient fill) |
| What dims | every sibling mark, its label, its line/area fill, leader lines, ring names |
| Timing | one token `FOCUS.duration` applied to every family (see open question 1) |
| Pointer, legend hover, keyboard | one entry point `focusMark(instance, target)` → same repair path, so all three look identical |
| Repair | one module `hover-focus-repair.ts` with per-family adapters (`keepNormal` vs `emphasize`) and one scheduler with a pending guard (fixes scatter late re-blur) |
| Opt-out | `hoverFocus={false}` also gates hover-trace dimming and the monospace fold |

## Scope — In

**Phase A — foundation + new chart** (lands first, no visual change to existing charts)
- `chart-signature.ts` tokens + live/headless resolvers (`--chart-gap`), unit tests.
- `FOCUS` tokens; `hover-focus-repair.ts` consolidating pie/funnel/treemap/waterfall/scatter/radial
  repairs; `focusMark` used by pointer, legend and keyboard; keyboard fixes (waterfall series
  index, repair families) and keyboard on radial, radar, heatmap, calendar, treemap, tile-column.
- **Rose pie**: `<Pie rose="radius" | "area">` on `NQPieChart` (ECharts `roseType`), built on the
  tokens: `radius.surface` corners, `gap.seam` pad, default inner radius 12%, start 90°
  clockwise, `sort="descending"` default for rose (prop `sort?: "descending" | "ascending" | "none"`
  on `<Pie>`). Registry example `ex-pie-rose`, docs section, consumer skill.
  Distinct from the existing radial `radialLayout="rose"` (equal-angle petals) — docs cross-link
  both.

**Phase B — shape rollout** (one family per commit, headless before/after render each)
- Pie/donut: `padAngle` + `radius.surface`. Treemap: single gap, `radius.surface`.
  Heatmap/calendar: seam + `radius.mark`. Tiles: tokens (drop literals in chart + compiler).
- Bars: `radius.mark` everywhere incl. waterfall honouring `barRadius`; stacked seams via
  `gap.seam`; one `categoryGap`/`groupGap`.
- Gauge round caps; radial ring gap from tokens.
- Funnel: rounded outer = `radius.surface`, inner = `radius.join` (builds on the in-flight inner
  corner fix), stage gaps = `gap.stage`; segmented border → real gap.
- Remove duplicate border injection in `apply-chart-chrome`; tile-column/calendar grids through
  `resolveCartesianGrid` where the layout allows.

**Phase C — strokes, focus polish, docs**
- Stroke/symbol/glow tokens on line, area, composed, radar, scatter, sparkline; radar fill blur +
  `shadowColor`; composed whiskers get blur; bar emphasis keeps normal fill.
- Label dimming on pipe/rounded funnel, radial ring names, rose leader labels.
- Docs: new "Signature" page (tokens table + how to theme `--radius` / `--chart-gap`),
  `hover-focus.mdx` table covers every family, consumer skill, `DESIGN.md` §Charts.
- Signature gallery: headless SVG render of every chart in light + dark, committed as the
  visual baseline (`scripts/render-signature-gallery.mjs`).

## Scope — Out

- New palette / colour changes (slots stay `--chart-N`).
- Fade animation experiments beyond the single `FOCUS.duration` token.
- Horizontal funnel cone, 3D for other families.
- npm publish (owner).

## Approach notes

- Every compiler reads tokens through one function (`resolveChartSignature(ctx)`) so headless
  and live stay identical; per-chart props (`barRadius`, `cornerRadius`, `stageGap`,
  `cellRadius`, `cellGap`, `innerRadius`) keep working as overrides.
- Pie `padAngle` is in degrees: `pad = gap.seam / outerRadiusPx × 180/π`, computed from the
  viewport in `ctx.viewport` (fallback card size).
- Repair consolidation lands behind the existing tests plus new ones per family; every
  `fixed/` hover entry (scatter symbol blur, treemap flicker/vanish, funnel/pie/waterfall/radial
  blur, intro axis-pointer clip) gets a regression test before the old module is deleted.
- Visual change is intentional → release as **0.5.0** with a migration note: "set
  `--chart-gap: 0` and per-chart radius props to 0 to restore the previous look".

## Acceptance

- [ ] No hardcoded radius/gap/stroke/symbol literals left in `compile-*.ts` (grep check in tests)
- [ ] Every family: hover, legend isolate and keyboard focus dim siblings + labels to 0.2; hovered
      mark pixel-identical to its normal state (headless snapshot of emphasis vs normal)
- [ ] `hoverFocus={false}` disables all dimming paths (incl. trace + fold)
- [ ] Rose pie matches the reference: angle & radius ∝ value, rounded corners, 2 px pad, small
      hole, descending clockwise from 12 o'clock; hover focus works; headless render in gallery
- [ ] Theming `--radius` / `--chart-gap` changes every family consistently (gallery at 0 / default / 2×)
- [ ] Verification gates from `docs/product/ai-contract.md` pass
- [ ] Consumer skill updated (`pnpm sync:skills`)
- [ ] `fixed/` notes for any hover regression found during consolidation

## Open questions (decide before Phase A)

1. **Focus timing:** instant (`0 ms`, today's safe choice for repair families) or a calm
   **120 ms ease-out fade** everywhere (more Apple/Linear, needs flicker re-testing on the five
   repair families)? Recommendation: 120 ms fade, falling back to 0 ms per family only if a
   `fixed/` regression reappears.
2. **Surface radius:** 11 px (`--radius-xl`) vs 8 px. Recommendation: 11 px — matches the
   reference rose image and the rounded funnel the team already liked (14).
3. **Default-on for existing pies:** pad + radius on every pie/donut by default (signature) vs
   opt-in. Recommendation: default-on in 0.5.0 with the migration note.

## Progress

**Phase A — done 2026-11-06**
- `chart-signature.ts` (+ `--chart-gap`, `HeadlessTheme.chartGapPx`, exported `readBaseRadiusPx`).
- Rose pie: `pie-sector-geometry.ts` (parallel seams + circular fillets; ECharts `padAngle` is
  wedge-shaped, so the rose is a custom series), `<Pie rose sort gap cornerRadius>`, fitted
  framing, `ex-pie-rose-chart`, docs section, consumer skill.
- Focus: `FOCUS` tokens (0.2 dim incl. legend, 120 ms cubicOut — no family needed the instant
  fallback), `hover-focus-repair.ts` consolidating six repairs with a pending guard,
  `focusMark` / `clearFocus` for pointer + keyboard, keyboard on radial / radar / heatmap /
  calendar / treemap / tile-column, waterfall keyboard targets the value series, intro-snap
  bug that silently disabled every fade, `hover-focus.mdx` table.
- Found + fixed: custom series never dimmed siblings (ECharts reads `focus` from the
  `renderItem` element) — `customFocusGroup` / `customFocusChild` on rose, pipe / rounded / cone
  funnel, tile-column; fix note `hover-focus-custom-series-element-focus`.
- Rounded funnel: big radius on outer corners only, `innerCornerRadius` (3) at every gap.

**Phase B — pie / donut pulled forward, done 2026-11-07**
- Every pie (plain, donut, rose) is one custom series on `pie-sector-geometry.ts`: even seam,
  11px corners, min visible span so slivers never vanish, outside labels on two-leg leader lines
  spread per side so they never overlap (slices under 3° skip their label). `gap={0}
  cornerRadius={0}` restores touching wedges.
- Pie docs corrected to the real API (removed phantom `Label`, `Background`, `paddingAngle`,
  `onSelectionChange`, …); consumer skill updated.

**Phase B — shape rollout, done 2026-11-07**
- Area marks: treemap one `gap.seam` gap at every level (painted border gone), `radius.mark`
  leaves (surface turned small tiles into pills — ECharts can't clamp per tile); heatmap +
  calendar `radius.mark` + seam (painted, the documented exception); tile-column defaults from
  the signature, grid via `resolveCartesianGrid`; duplicate treemap / funnel border injection
  removed from `apply-chart-chrome`.
- Treemap dim was 0.1: ECharts' treemap `stateProxy` drops `opacity` → treemap repair adapter
  `prepareBlur` pins blur opacity to `FOCUS.dim` (browser-measured alpha 0.20).
- Bars: one radius source (`radius.mark`, overrides everywhere incl. waterfall `barRadius`),
  shared `bar.categoryGap` / `groupGap` (stacked 55% width dropped), stack seams as a zero-blur
  background shadow offset toward zero (not `borderWidth`, which shrank bars), `radius.join` on
  seam-facing corners, zero line always square; monospace + hover-trace pill from tokens.
- Arcs + funnel: gauge round caps; radial ring radius / gap from the signature; funnel presets
  from `gap.stage` (8), rounded `radius.surface` / `radius.join`, segmented real gap.
- Radial rose rebuilt on `pie-sector-geometry` (seam + fillets, tracks as sectors); labels moved
  into the petal series on the shared leader-line layout (were floating at the envelope).
- `customFocusChild` hover state is `fill: "inherit"`: ECharts' default color lift can't parse
  CSS-var / oklch fills and the hovered petal vanished (fix note updated).

**Carried into Phase C**
- Not yet browser-checked: fade on radial, bar, radar, heatmap, calendar, tile-column; keyboard
  nav on the six new roots (no docs demo sets `onMarkClick`); rounded/cone/pipe funnel and
  tile-column hover after the element-focus fix (unit-tested; same mechanism verified on rose).

## Out of scope / follow-ups

- Per-chart "density" presets (compact dashboards) built on the same tokens.
