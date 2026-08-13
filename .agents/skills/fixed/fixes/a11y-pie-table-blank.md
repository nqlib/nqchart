---
name: nqchart-fixed-a11y-pie-table-blank
description: >-
  Fixed: pie sr-only table was a grid of blanks because series keys came from
  Object.keys(config) (slice names) instead of the value column on { name, value } rows.
skill: nqchart-fixed
kind: fix
domain: a11y
status: fixed
fixed: "2026-08"
tags: pie, a11yTable, ChartA11yTable, derivePieSeriesKeys, config
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: pie a11y table is a grid of blanks

**Domain:** [a11y](../domains/a11y.md)  
**Status:** fixed (2026-08)  
**Verify:** `pnpm test` (`chart-a11y.test.ts`); showcase `/charts/lab` case `a11y.pie-table`.

## Symptoms

- Hidden pie table has one row per slice but every `<td>` is empty.
- Consumer turned `a11yTable={false}` on a donut with a comment naming the bug.
- Cartesian tables (including null-as-empty) were fine.

## Root cause

`deriveSeriesKeysFromConfig` uses `Object.keys(config)`. Pie `config` is keyed by
slice name for colour (`{ Alpha: { label, color } }`). Rows are `{ name, value }`,
so `row["Alpha"]` is always undefined. `a11yTable` defaults true.

## Fix (do not revert)

| File | Change |
|------|--------|
| `echarts-core/chart-a11y.tsx` | `derivePieSeriesKeys(data, nameKey, valueKey?)` — explicit key, else `"value"`, else first non-name column |
| `charts/pie-chart.tsx` | Use `derivePieSeriesKeys`, not `deriveSeriesKeysFromConfig` |

Do **not** key pie tables off config. Funnel is out of this fix unless a consumer reports it.

## Wrong fixes (rejected)

- Defaulting `a11yTable` to false on pie — hides the table instead of filling it.
- Using config labels as series keys and looking up by `row.name` — still wrong for the value column.
