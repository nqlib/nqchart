---
id: EP-001
title: Registry foundation & compound API
status: done
target: 2026-Q2
owner: nqchart
---

# EP-001 — Registry foundation & compound API

## Goal

Ship NQChart as a **shadcn-style registry** of composable `NQ*Chart` roots on Apache
ECharts — one primitive per chart family, installable into consumer apps without a
monolithic chart enum.

## Why now

This is the founding epic. Everything else assumes compound roots, part registration, and
pure compilers.

## Scope — In

- `src/registry/charts/*` compound roots
- `src/registry/echarts-core` compile pipeline
- Registry build → `public/r/*.json`
- Chart-recipes for BI synonyms
- Migration off Recharts

## Scope — Out

- BI board interaction APIs (→ EP-004)
- Docs site / agent HTTP (→ EP-002)

## Stories (retrospective)

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| ST-001 | Compound roots + part registry | done | `PartRegistryProvider`, null-render parts |
| ST-002 | Pure `compile-*` pipeline | done | Vitest baseline plan 001 |
| ST-003 | Chart-recipes + catalog discipline | done | no synonym packages |
| ST-004 | Cartesian factory + grid contract | done | `createCartesianChart`, `resolveCartesianGrid` |

## Success metrics

- Consumers install `@nqchart/bar-chart` (or npm subpath) and compose children.
- Registry boundary audit stays green.

## Dependencies

None — foundation.
