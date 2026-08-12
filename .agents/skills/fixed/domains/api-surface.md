---
name: nqchart-fixed-domain-api-surface
description: >-
  Domain: public TypeScript props / dist types vs runtime wiring. Standalone
  props omitting factory fields; docs naming props absent from dist/types.
skill: nqchart-fixed
kind: domain
domain: api-surface
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: api-surface

Public props types and `dist/types/` must admit what the factory already wires.

## Fixes

- [standalone props drop inherited](../fixes/api-surface-standalone-props-drop-inherited.md)

## When investigating

1. Probe with `tsc` against `dist/types/`, not grep of `src/`.
2. Prefer extending `CartesianChartBaseProps` over re-listing interaction props.
3. `pnpm run check:api` is the regression gate.
