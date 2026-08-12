---
id: EP-006
title: Engine hardening
status: planned
target: 2026-Q4
owner: nqchart
---

# EP-006 — Engine hardening

## Goal

Make illegal cross-domain compile reads a type error, and prepare an ECharts 6 migration
without breaking registry standalone files.

## Scope — In

- `CartesianCompileContext` vs `RadialCompileContext` narrowing
- ECharts 6.x investigation + migration plan
- next-themes patch re-audit when upgrading

## Scope — Out

- Per-chart ECharts module registration (known limitation — breaks standalone story)

## Stories

| ID | Title | Status |
|----|-------|--------|
| ST-016 | Narrowed CompileContext types | planned |
| ST-017 | ECharts 6 migration spike | planned |
| ST-018 | next-themes patch audit | planned |
| ST-019 | Dead public prop cleanup (`glowing`, …) | planned |

## Dependencies

EP-001; test baseline already landed (plan 001).
