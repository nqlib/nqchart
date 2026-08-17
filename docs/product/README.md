# Product layer — philosophy, specs, epics & stories

The product backlog and feature record, following
[`agentic-coding-guideline.md`](agentic-coding-guideline.md).

```
philosophy.md     beliefs that decide API shape
specs.md          numbered public API promise (S1…S5)
epics/EP-NNN-*/   capability programs (what/why)
  epic.md
  stories/ST-NNN-*.md
plans/NNN-*.md    technical blueprints (how) — linked from stories
```

## Epic index

| ID | Epic | Status |
|----|------|--------|
| [EP-001](epics/EP-001-registry-foundation/epic.md) | Registry foundation & compound API | done |
| [EP-002](epics/EP-002-docs-and-agents/epic.md) | Docs site, skills, agent HTTP | done |
| [EP-003](epics/EP-003-chart-craft/epic.md) | Chart craft — hover, motion, brush | **in-progress** (ST-023 / plan 017) |
| [EP-004](epics/EP-004-bi-readiness/epic.md) | BI readiness — interaction, axes, annotations, a11y | **done** (009–015; 0.3.0; SecoLab Phase 4 manual) |
| [EP-005](epics/EP-005-distribution/epic.md) | Distribution & docs-truth | **in-progress** (ST-022 / plan 016) |
| [EP-006](epics/EP-006-engine-hardening/epic.md) | Engine hardening (typed contexts, ECharts 6) | planned |

**Next IDs: `EP-007` / `ST-024`.**

IDs are global and never reused. Mint against this table **and** open branches before
creating files.

## How EP/ST relates to `plans/`

| Layer | Question | Home |
|-------|----------|------|
| Epic | What capability are we buying? Why now? | `product/epics/EP-*/epic.md` |
| Story | What slice is shippable? Acceptance? | `product/epics/EP-*/stories/ST-*.md` |
| Plan | How do we change the code? | `plans/NNN-*.md` |

- **Features still need a plan** before `src/` edits (unchanged hard rule).
- Stories are the **capability record** (especially for cross-repo consumers like SecoLab
  ST-289). A story may link one or more plans.
- Small chores/bugs skip EP/ST; bugs go through `fixed/` first.

## Templates

- [`epics/_templates/epic.md`](epics/_templates/epic.md)
- [`epics/_templates/story.md`](epics/_templates/story.md)

## Steering

| Doc | Role |
|-----|------|
| [[product/philosophy]] | Beliefs |
| [[product/specs]] | API promise |
| [[product/roadmap]] | Deferred / not-planned list |
| [[product/ai-contract]] | Definition of done |
| [[product/agentic-coding-guideline]] | Intake ladder |

## About this baseline (2026-08-11)

EP-001…003 were written **retrospectively** from the shipped codebase and completed plans
001–008. EP-004 was written as the capability record for plans 009–015 (BI readiness),
which unblocked SecoLab's NQChart renderer migration (their ST-289). Phase 4 smoke stays
in the consumer.
