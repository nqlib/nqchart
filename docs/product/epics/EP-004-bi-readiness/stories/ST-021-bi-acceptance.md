---
id: ST-021
epic: EP-004
title: "BI-readiness acceptance (dist probe + /bi-check + 0.3.0 prep)"
status: done
priority: must
estimate: 2
owner: nqchart
plan: plans/013-bi-readiness-acceptance-test-plan.md
---

# ST-021 — BI-readiness acceptance

As a maintainer preparing 0.3.0,
I want acceptance against `dist/types` and `/bi-check`,
so that we publish only what a consumer can actually install and type-check.

## Acceptance criteria

- [x] Phase 1: `check:api` / type probe against `dist/types` — zero errors on cartesian `onMarkClick`
- [x] Phase 2: composed + bar docs props exist in `dist/types` (removed phantom `verticalAlign`)
- [x] Phase 3: `/bi-check` cases exercise click, legend, brush, empty, a11y, export
- [ ] Phase 4 (manual): SecoLab link smoke left as consumer follow-up
- [x] Version `0.3.0` + changelog entry (no publish required)
- [x] Verification gates from `docs/product/ai-contract.md` pass

## Out of scope

- npm publish / tagging
- Docs-truth CI lint
- nqui-showcase `/charts/lab`

## Blueprint

[`plans/013-bi-readiness-acceptance-test-plan.md`](../../../../plans/013-bi-readiness-acceptance-test-plan.md)

## Notes

Depends on ST-020. Assert against the build, never only against `src/`. Phase 4 is outside this monorepo.
