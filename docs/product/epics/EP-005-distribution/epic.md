---
id: EP-005
title: Distribution & docs-truth
status: in-progress
target: 2026-Q4
owner: nqchart
---

# EP-005 — Distribution & docs-truth

## Goal

Keep the **published** surface honest: npm/`dist/types` and MDX/skill prose cannot drift,
and publish/verify pipelines stay boring.

## Why now

Plan 010 fixed docs that described flat `yAxisId` while types did not. Plan 012 called for
a CI docs-truth lint. Without it, SecoLab-class migrations will rediscover drift.

## Scope — In

- CI check: props named in docs / skill exist in built `.d.ts`
- Publish verify scripts stay green (`build:npm`, `check:dist`, `check:api`, `check:size`, `check:internals`)
- Per-family ECharts registration so a single chart entry does not pull the whole library
- Optional: registry `shadcn add` smoke in CI

## Scope — Out

- CMS for docs
- Auth on MCP

## Stories

| ID | Title | Status | Plan |
|----|-------|--------|------|
| ST-014 | Docs-truth lint against `dist/types` | planned | (mint plan when starting) |
| ST-015 | Consumer install smoke (`shadcn add` or npm) | planned | — |
| [ST-022](stories/ST-022-echarts-payload.md) | Per-family ECharts payload + export/internals guards | **review** | [016](../../../../plans/016-echarts-payload.md) |

## Dependencies

EP-002, EP-004.
