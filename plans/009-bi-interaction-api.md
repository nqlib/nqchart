# Plan 009 — BI interaction API: mark click, legend selection, brush range

- **Status:** DONE
- **Written:** 2026-08-11
- **Effort:** M · **Risk:** low
- **Skills:** `nqchart-dev` / `nqchart-docs`

## Why

A BI renderer is not a picture. Clicking a bar has to be able to filter a dashboard;
selecting a legend entry has to isolate a series; dragging a brush has to narrow a time
range. NQChart draws better than the alternatives and cannot yet do any of those from its
**public** API.

This is blocking real work today. `secolab` set out to move its Dashboards v2 renderer
(`components/chart-viz.tsx`) onto NQChart and stopped, because two shipped features —
board cross-filtering and drill-by — ride on an `onMarkClick` prop, and 0.2.2 exposes no
handler on any chart root or series part. Searching the published types for
`onClick|onSelectionChange|onEvents` returns nothing. That app shipped its legend and dual
axis on recharts instead and filed the migration as blocked-on-upstream (its ST-289).

**The good news, and the reason this plan is M and not L:** most of the capability already
exists internally. It is the public surface that is missing.

| Capability | Internally | Publicly |
|---|---|---|
| Legend selection | `ChartLegendContent` / `NQChartLegend` take `selected` + `onSelectChange` | per-chart `<Legend>` exposes only `variant align isClickable hideIcon className` |
| Brush range | `useChartBrush` returns `{ range, visibleData, brushProps }` with `onChange` | not re-exported from `lib/public.ts` |
| Mark click | — | — |

So two of the three are plumbing, and only mark click is new construction.

## Scope — In

**1. Mark click on every cartesian and radial root.** One prop on the root, not per series —
a handler per `<Bar>` multiplies the wiring and makes "which series" ambiguous when marks
overlap.

```ts
type NQMarkEvent = {
  /** The x/category value, already formatted through the axis. */
  category: string;
  /** The series `dataKey`, or the slice `nameKey` for pie / funnel / treemap. */
  seriesKey: string;
  /** Raw datum for the mark. */
  datum: Record<string, unknown>;
  value: number | null;
  /** Index into `data`, so a caller can address the row without a lookup. */
  index: number;
  /** Modifier state — a BI board needs shift-click to add to a selection. */
  modifiers: { shift: boolean; meta: boolean; alt: boolean };
};

// on every NQ*Chart root
onMarkClick?: (event: NQMarkEvent) => void;
```

Implement once in the ECharts core as a `click` handler on the instance, mapping
`params.dataIndex` / `params.seriesName` back to `data` and `config`. Every root inherits it
from the shared shell rather than re-registering per chart type.

**2. Plumb legend selection through the public `<Legend>`.** Add `selected` and
`onSelectChange` to each chart's `Legend` wrapper, forwarding to `NQChartLegend`, which
already accepts both. Uncontrolled stays the default so nothing changes for current callers.

**3. Export the brush range hook.** Add `useChartBrush` and `ChartBrushRange` to
`lib/public.ts`, and add `onBrushChange?: (range: ChartBrushRange) => void` to roots that
accept `showBrush`, so a consumer can react to a range without owning the data slice.

**4. One escape hatch, documented as such.** `onChartReady?: (instance: ECharts) => void`.
Every wrapper eventually meets a need its props do not cover; a sanctioned hatch is better
than a fork. Document it as unsupported surface — using it opts out of API stability.

## Scope — Out

- Selection *state* (which marks are highlighted). NQChart reports events; the consumer owns
  selection. Owning it here would fight every state library a consumer already uses.
- Cross-chart linking / brushing between charts. Consumer concern, built on these events.
- Right-click / context menus. Separate plan if demand appears.

## Approach

- Core: one `click` binding in the shared ECharts shell, plus a mapper from ECharts
  `params` to `NQMarkEvent`. Guard against `params.componentType !== "series"`.
- Roots: add `onMarkClick` and `onBrushChange` to each root's props type and pass through.
  The per-chart `Legend` wrappers gain two forwarded props each — mechanical.
- `lib/public.ts`: export `useChartBrush`, `ChartBrushRange`, `NQMarkEvent`.
- Null marks must not fire. A click on empty plot area must not fire either.
- Pointer affordance: set `cursor: pointer` on series only when a handler is present, so a
  static chart does not advertise interactivity it lacks.

## Acceptance

- [ ] `onMarkClick` fires on bar, line, area, composed, pie, scatter, treemap, funnel and
      radial roots, carrying category, seriesKey, datum, value, index and modifiers.
- [ ] A click on a null datum or on empty plot area does not fire.
- [ ] `cursor: pointer` appears on marks only when a handler is bound.
- [ ] `<Legend selected onSelectChange />` works on every root that has a legend; omitting
      both preserves today's uncontrolled behaviour exactly.
- [ ] `useChartBrush` and `ChartBrushRange` are importable from `@nqlib/nqchart`.
- [ ] `onBrushChange` fires on roots supporting `showBrush`.
- [ ] `onChartReady` exposes the ECharts instance and is documented as unsupported surface.
- [ ] Verification gates from `docs/product/ai-contract.md` pass for touched surfaces
- [ ] Consumer skill updated (`pnpm sync:skills`) — the skill must show a cross-filter example
- [ ] Bug? → `.agents/skills/fixed/` note if non-trivial regression risk

## Out of scope / follow-ups

- Plan 010 (axes and formatting) is the other half of what secolab needs before it can
  migrate; this plan alone unblocks the *features*, not the *parity*.
- A worked "dashboard cross-filter" example on the docs site, after this lands.
