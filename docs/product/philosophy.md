# Product philosophy

Why NQChart looks the way it does — the beliefs that decide API shape before any epic.

## 1. A chart is a composition, not a type enum

Consumers assemble `NQ*Chart` + children (`Bar`, `Grid`, `Tooltip`, `ReferenceLine`).
We reject a single `<Chart type="bar" isStacked isGauge />` because boolean props explode
and hide what actually renders.

**Test:** if you cannot tell what a call site draws without opening the implementation,
the API failed.

## 2. Primitives + recipes, not synonym packages

Histogram, Pareto, gauge, bullet, box plot are **data shapes** (and examples) on bar /
composed / radial — not `histogram-chart` registry items. The catalog stays small;
`@nqlib/nqchart/recipes` holds shared prep.

**Test:** a new BI synonym must justify a new *geometry*. If ECharts already draws it via
an existing series type, add a recipe + example.

## 3. The library reports events; the board owns state

`onMarkClick`, `onBrushChange`, and controlled `Legend` selection notify. Cross-filter
sets, drill stacks, and multi-select live in the host app (SecoLab, etc.). Owning
selection here would fight every state library a consumer already uses.

## 4. Theme tokens over hex in the API

`ChartConfig` resolves light/dark. Reference marks use semantic `tone`. Export defaults
to the resolved surface color. Consumers should not pass raw hex unless they opt out of
theming.

## 5. Wallpaper XOR grid

Decorative `<ChartBackground />` and value `<Grid />` compete for the same attention.
Never both. Documented in the consumer skill; enforced by craft, not a runtime error.

## 6. Pass through what ECharts already does well

Tick formatters, log scale, `markLine` / `markArea`, `getDataURL` — wrap with a compound
face, do not reimplement. Invest library code where ECharts is hostile (hover-focus
repairs, monospace bars, brush footer, a11y table).

## 7. One documented escape hatch

`onChartReady` / `chartRef.getInstance()` exist so the next unmet need does not fork the
package. They are **unsupported surface** — using them opts out of API stability. Prefer
promoting a repeated escape into a typed prop (that is how `onMarkClick` earned its place).

## 8. Docs truth is part of the product

A published `.d.ts` that disagrees with MDX blocked a real migration (SecoLab ST-289).
Specs and examples must be verified against what consumers install, not only source.

## Related

- [[product/specs]] — the concrete API promise
- [[architecture/layers]] — how philosophy maps to folders
- [[product/README]] — epics that carry this forward
