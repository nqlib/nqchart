---
name: nqchart-fixed-domain-series-id
description: >-
  Domain: ECharts series `id`. Duplicate ids throw at setOption when two marks
  share a dataKey; click and legend isolate must still resolve to the dataKey.
skill: nqchart-fixed
kind: domain
domain: series-id
tags: series id, id duplicates, composed, Area, Line, setOption
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: series-id

ECharts requires unique `series.id`. Compilers normally set `id` to the config
`dataKey`. Composed fill-under-line (`<Area dataKey="otd" />` +
`<Line dataKey="otd" />`) would emit two series with `id: "otd"` and throw
`id duplicates: otd` at `setOption`.

The second series takes `${dataKey}__nq_<kind>`. Public `onMarkClick.seriesKey`
and legend isolate still use the dataKey — strip via `dataKeyFromSeriesId`.

## Fixes

- [duplicate series ids](../fixes/series-id-duplicates.md)

## When investigating

1. `uniquifySeriesIds` in `series-identity.ts` — applied in `compile-composed.ts`.
2. Click mapper: `nq-mark-event.ts` must strip `__nq_(area|line|bar|whiskers)`.
3. Legend isolate: `legend-focus.ts` matches via `seriesMatchesLegendKey`.
4. HTML legend duplicate React keys are a different bug — see [legend](./legend.md).
