# Product roadmap

Steering backlog for maintainers and AI agents.

- **Capability record:** [[product/README]] (epics & stories)
- **Change design:** `plans/README.md`
- **Intake:** [[product/agentic-coding-guideline]]
- **API promise:** [[product/specs]]
- **Deep review scrap:** `plan/IMPROVEMENT_PLAN.md`

## Active / recent

| Program | Status |
|---------|--------|
| [EP-004 BI readiness](epics/EP-004-bi-readiness/epic.md) | **done** (009–015; 0.3.0; SecoLab Phase 4 manual) |
| [EP-005 Distribution & docs-truth](epics/EP-005-distribution/epic.md) | planned |
| [EP-006 Engine hardening](epics/EP-006-engine-hardening/epic.md) | planned |

## Completed foundations

- EP-001 Registry foundation & compound API
- EP-002 Docs site, skills, agent HTTP
- EP-003 Chart craft (hover, motion, funnel 007–008)
- Plans 001–008 (tests, MCP, hygiene, CONTRIBUTING, landing, funnel)

Also completed in full-roadmap pass: cartesian chart factory, color-token migration,
motion/TOC tokens, OG route, registry boundary audit, ECharts patch notes
(`patches/README.md`).

## Deferred (mapped into EP-005 / EP-006)

1. **Docs-truth lint** — props in MDX/skill must exist in `dist/types/` (EP-005 / ST-014).
2. **Narrowed `CompileContext` types** — cartesian vs radial (EP-006 / ST-016).
3. **ECharts 6.x upgrade** — stay on 5.6.x until ST-017 (EP-006).
4. **next-themes patch audit** — EP-006 / ST-018.
5. **Dead public prop cleanup** — EP-006 / ST-019.
6. **Hover-trace / monospace generalization** — parameterize by `seriesId`.
7. **Install command package-manager switcher** on landing.
8. **Per-chart ECharts module registration** — known limitation; not planned as a goal.

## Explicitly not planned

- CMS for landing demo data
- Engine rewrite (architecture is sound — see [[architecture/layers]])
- Auth/rate-limiting on `/mcp` (public docs)
- Multi-select legend / cross-chart brush (consumer concerns; see specs Out of contract)

Pick the first unblocked story when starting new work. DoD: [[product/ai-contract]].
