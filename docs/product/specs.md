# Product specs — public API promise

Human-readable contract for what NQChart **guarantees**. Machine-oriented detail:
[[architecture/public-surface]]. Consumer how-to: `skills/consumer/nqchart/`.

Version baseline for this document: **`@nqlib/nqchart@0.3.0`** (BI readiness consumable).

**Spec revision:** 2026-08-16 (ST-023 `hoverFocus`)

---

## S1 — Composition

| ID | Spec |
|----|------|
| S1.1 | Every chart family is a compound root `NQ*Chart` plus optional children. |
| S1.2 | Series / axis / grid / legend / tooltip / reference parts register via context; most return `null`. |
| S1.3 | `chartConfig` keys match series `dataKey` (and pie `nameKey` segments). |
| S1.4 | Interactive charts expect a composed `<Tooltip />`. |

## S2 — Interaction (BI)

| ID | Spec |
|----|------|
| S2.1 | Cartesian, pie, and funnel roots accept `onMarkClick?(NQMarkEvent)`. Waterfall accepts it too. |
| S2.2 | `NQMarkEvent.category` is the **raw** datum field (not only the formatted tick). |
| S2.3 | Modifiers include `shift`, `meta`, `alt`, `ctrl` for board selection patterns. |
| S2.4 | Null marks and empty plot clicks do not fire. |
| S2.5 | `cursor: pointer` on series only when a mark handler is bound. |
| S2.6 | `<Legend selected onSelectChange />` is controllable; omit both → uncontrolled. |
| S2.7 | Legend selection is **single-select** (`string \| null`) in this revision. |
| S2.8 | `onBrushChange` + exported `useChartBrush` / `ChartBrushRange` on brush-capable roots. |
| S2.9 | `onChartReady` / `chartRef` exist as unsupported escape hatches. |
| S2.10 | Every `NQ*Chart` root accepts `hoverFocus?: boolean` (default on). `false` keeps tooltip, disables sibling dim. Sparkline / single-arc gauge stay tooltip-only either way. |

## S3 — Axes & marks

| ID | Spec |
|----|------|
| S3.1 | `XAxis` and `YAxis` accept `tickFormatter`, `scale`, `reversed`, dense-label props. |
| S3.2 | Dual Y works on bar, line, area, composed, scatter. |
| S3.3 | Series bind with flat `yAxisId`; nested `*Props.yAxisId` deprecated but accepted. |
| S3.4 | `<ReferenceLine>` / `<ReferenceBand>` draw in data space with semantic `tone`. |
| S3.5 | Reference marks are excluded from legend and `onMarkClick`. |
| S3.6 | `NQComposedChart` accepts `<Bar>`, `<Line>`, and `<Area>`. |
| S3.7 | `showLabels` / `labelFormatter` on bar, line, area series. |

## S4 — States, a11y, export

| ID | Spec |
|----|------|
| S4.1 | `isLoading` shows a skeleton; empty and error are distinct plates. |
| S4.2 | Default empty when `data.length === 0` unless `isEmpty` overridden. |
| S4.3 | Default `a11yTable` emits a visually hidden table (row-capped); canvas is `aria-hidden` when present. |
| S4.4 | With `onMarkClick`, the plot is keyboard-focusable; arrows move; Enter fires the same event. |
| S4.5 | `chartRef.current.toDataURL()` returns PNG or SVG with a themed background by default. |
| S4.6 | Intro / transition animation respects `prefers-reduced-motion`. |

## S5 — Distribution & docs

| ID | Spec |
|----|------|
| S5.1 | Registry items do not import `src/components/**`. |
| S5.2 | Compilers in `compile-*.ts` are pure (no hooks / `document`). |
| S5.3 | Public docs live in `src/content/docs/`; maintainer vault in `docs/`. |
| S5.4 | Consumer skill SOT is `skills/consumer/nqchart/` → `pnpm sync:skills`. |

## Out of contract (explicit)

- Cross-chart brushing / linking (consumer concern).
- Multi-select legend isolate.
- Server-side chart image rendering.
- CSV/XLSX export of underlying data.
- Automatic unit conversion.
- More than two Y axes.

## Related

- [[product/philosophy]] · [[architecture/public-surface]]
- Plans that closed the BI gap: `plans/009`…`012` · epic [[product/epics/EP-004-bi-readiness/epic]]
