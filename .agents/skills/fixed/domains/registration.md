---
name: nqchart-fixed-domain-registration
description: >-
  Domain: ECharts module registration per family. A compiler emits a component
  (markLine, markArea, dataZoom, graphic) that the family never registered, so
  ECharts drops it without an error in production.
skill: nqchart-fixed
kind: domain
domain: registration
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: registration

Each family registers only the ECharts modules it draws (plan 016, `getEcharts(extra)`).
A compiler that emits a component key needs that component in the family's module list.

## Fixes

- [MarkLine and MarkArea not registered](../fixes/registration-markline-markarea.md)

## When investigating

1. Find the option key the compiler emits (`markLine`, `markArea`, `dataZoom`, `graphic`).
2. Find the family's `*_ECHARTS_MODULES` list in `src/registry/charts/<family>-chart.tsx`.
3. The component must be in that list. `echarts.use` is idempotent; `getEcharts` guards by module identity.
4. A missing component logs only in a dev build of ECharts; production drops the key silently.
5. A synthetic series needs its chart type too: the reference series is `type: "line"`.
