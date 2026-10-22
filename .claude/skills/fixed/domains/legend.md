---
name: nqchart-fixed-domain-legend
description: >-
  Domain: HTML chart legend. Duplicate React keys when two marks share a
  dataKey; isolate/focus matching series id vs config key.
skill: nqchart-fixed
kind: domain
domain: legend
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: legend

The HTML `<Legend />` lists series from registered parts. Keys are config
`dataKey`s. Two marks on the same key (composed Area + Line fill-under-line)
must collapse to one row.

## Fixes

- [duplicate dataKey React keys](../fixes/legend-duplicate-datakey.md)

ECharts `id duplicates: otd` is a different bug — see [series-id](./series-id.md).

## When investigating

1. Check `seriesKeysFromParts` / `uniqueLegendSeriesKeys` in `ui/legend.tsx`.
2. Isolate still keys off `dataKey` (`selected === key`); do not invent a second
   legend identity unless `onSelectChange` changes.
