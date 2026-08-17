# Public surface (contract)

The BE/FE “OpenAPI snapshot” for this library is the **published TypeScript surface** —
what a consumer gets from `@nqlib/nqchart` and from registry copies of `charts/*.tsx`.

When the public surface changes, update this note and [[product/specs]] in the same PR as
the code. Prefer verifying against **`dist/types/`** (or the installed package), not only
source — docs that describe flat `yAxisId` while `.d.ts` still nested it already burned a
migration once (SecoLab ST-289).

## Package entry points

| Import | Contents |
|--------|----------|
| `@nqlib/nqchart` | `ChartConfig`, shell UI, `useChartBrush`, `NQMarkEvent`, `ChartHandle`, `ReferenceLine` / `ReferenceBand` |
| `@nqlib/nqchart/bar-chart` | `NQBarChart`, `Bar`, axes, legend, tooltip, … |
| `@nqlib/nqchart/<family>-chart` | Same pattern per primitive |
| `@nqlib/nqchart/recipes` | `binForHistogram`, `prepareParetoData`, … |

Root barrel: `src/lib/public.ts`. Family barrels: each `charts/<family>-chart.tsx`.

## Interaction contract (BI boards)

```ts
type NQMarkEvent = {
  category: unknown;          // raw axis / row value — not only the tick label
  categoryLabel?: string;
  seriesKey: string;
  datum: Record<string, unknown>;
  value: number | null;
  index: number;
  modifiers: { shift: boolean; meta: boolean; alt: boolean; ctrl: boolean };
};

// bar, line, area, composed, scatter, pie, waterfall, funnel
onMarkClick?: (event: NQMarkEvent) => void;
onBrushChange?: (range: ChartBrushRange) => void; // brush-capable roots
hoverFocus?: boolean; // default on; false keeps tooltip, skips sibling dim
onChartReady?: (instance: EChartsType) => void; // unsupported escape hatch
chartRef?: Ref<ChartHandle | null>;             // getInstance + toDataURL
```

`seriesKey` is the config **dataKey**, not the display label. Compilers set ECharts
series `id` to `dataKey`. When two marks share a dataKey (composed Area + Line),
the second series uses `${dataKey}__nq_<kind>`; the click mapper strips that
suffix so `seriesKey` stays the dataKey. The mapper prefers `seriesId`, then an
embedded `__nq_seriesKey`, then a label→key reverse map. Pie / funnel use the
raw `nameKey` / `stageKey` value as `seriesKey`.

Selection **state** is owned by the consumer. Legend `selected` / `onSelectChange` is
single-select isolate today (`string | null`).

## Axis contract

- `XAxis` / `YAxis`: `tickFormatter`, `scale`, `reversed`, `labelRotate`, `labelInterval`
- Dual Y on every cartesian family; bind series with flat `yAxisId`
- Deprecated: `barProps` / `lineProps` `{ yAxisId }` (still accepted)

## Annotation contract

- `<ReferenceLine y|x />`, `<ReferenceBand y|x={[lo,hi]} />`
- `tone`: `neutral` | `accent` | `positive` | `warning` | `critical`
- Not in legend; not reported by `onMarkClick`

## States / a11y / export

| Prop | Behavior |
|------|----------|
| `isLoading` | Skeleton (existing) |
| `isEmpty` / `emptyState` | Empty plate; default empty when `data.length === 0` |
| `error` | Error plate, distinct from empty |
| `a11yTable` | Visually hidden table (default on; row-capped) |
| `chartRef.toDataURL` | PNG with themed background (`CanvasRenderer` only) |

## ECharts private internals

Hover-focus and rollout-intro import three **non-public** echarts paths. There is no
public equivalent. They stay; CI resolves them so a moved file fails our build
instead of a consumer's runtime:

| Path | Used by |
|------|---------|
| `echarts/lib/util/states.js` | pie / funnel / radial / scatter / treemap / waterfall hover-focus |
| `echarts/lib/animation/basicTransition.js` | `apply-rollout-intro.ts` |
| `echarts/lib/util/graphic.js` | `apply-rollout-intro.ts` |

Verified against **echarts 5.6.0** (installed peer; range `^5.6.0`). Gate:
`pnpm run check:internals` inside `build:npm`.

## Stability rules

1. **Additive preferred.** New optional props over breaking renames.
2. **Deprecate one minor, remove the next.** Nested `yAxisId` is the template.
3. **`onChartReady` is unsupported.** Anything done through the raw instance is out of
   semver for the library.
4. **Docs must match `dist/types`.** A docs-truth lint is a planned follow-up (plan 012).

## Related

- [[product/specs]] — human-readable API promise
- [[architecture/system]] · [[architecture/layers]]
- Consumer skill: `skills/consumer/nqchart/components.md`
