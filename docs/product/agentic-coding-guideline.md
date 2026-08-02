# Agentic coding guideline (maintainers)

How agents and humans keep NQChart from drifting: **intake → plan → implement → record**.

Companion docs:

| Doc | Role |
|-----|------|
| Root [`AGENTS.md`](../../AGENTS.md) | Orientation + skill routing |
| [[product/ai-contract]] | Definition of done + hard rules |
| [[product/roadmap]] | Steering backlog |
| [`plans/README.md`](../../plans/README.md) | Change-design index (executor plans) |
| [`memory/INDEX.md`](../../memory/INDEX.md) | Durable non-code lessons (on demand) |
| [`.agents/skills/fixed/`](../../.agents/skills/fixed/SKILL.md) | Bug/regression search index |

This is a **library** repo — we use **plans**, not SecoLab-style epic/story boards. Same anti-drift idea: no feature-sized work without a trace in the repo.

---

## 1. Sequence of execution (do not skip)

```
1. Orient     → AGENTS.md → load 1–3 skill/docs files (do not bulk-read)
2. Recall     → memory/INDEX.md if prior decisions might apply
3. Intake     → classify size; find or create a plan home (below)
4. Plan       → for features: plans/NNN-*.md approved before src/ edits
5. Implement  → only what the plan / bug fix requires
6. Verify     → ai-contract DoD gates
7. Record     → bugs → fixed skill; durable decisions → memory/ (rare)
```

**Blueprint discipline:** if implementation shows the design is wrong, **stop**, update the plan
(and architecture notes if needed), then continue. Code must not silently diverge from the plan.

---

## 2. Decision ladder (intake)

| Size | Examples | Home before code |
|------|----------|------------------|
| **Chore** | Typo, comment, dependency bump with no API change | None — ship with clear commit |
| **Bug** | Hover flicker, label clip, wrong compile output | Search **fixed** first; fix + fix-note in same PR |
| **Small fix** | One-file polish matching existing contract | None if under ~1 hour and no API/behavior contract change |
| **Feature** | New chart API, compiler behavior, docs capability, multi-file refactor | **`plans/NNN-kebab.md`** (new or existing) |
| **Epic-sized** | Multi-phase program | Several plans under `plans/`; implement one plan at a time |

Hard rule: **no feature lands without a row in `plans/README.md`.**  
Exempt: chores, bugs, and small fixes per the ladder.

---

## 3. Intake — work with no plan yet

**Feature request:**

1. Search `plans/README.md` and [[product/roadmap]] for coverage.
2. **Found** → set plan status `IN-PROGRESS`, implement that scope only.
3. **Not found** → ask whether it is feature-sized; if yes, draft `plans/NNN-kebab-name.md` from
   [`plans/_template.md`](../../plans/_template.md), get approval, **then** edit `src/`.
4. Chat-only / ephemeral plan mode is **not** sufficient for features — the plan must live in the repo.

**Bug:**

1. Search [`.agents/skills/fixed/index.md`](../../.agents/skills/fixed/index.md).
2. Open matching fix note before reinventing.
3. If new: fix + add domain/fix note + index rows in the same PR (`pnpm skill:validate`).

---

## 4. Plan file rules

- Next id = max existing `NNN` in `plans/` + 1 (zero-pad to 3).
- Status badges in `plans/README.md`: `TODO` | `IN-PROGRESS` | `DONE` | `BLOCKED` | `CANCELLED`.
- Move completed narrative into DONE; keep the file for history.
- Same PR updates plan status when the work lands.

---

## 5. Memory vs fixed vs docs

| Kind | Where |
|------|--------|
| Architecture / DoD / backlog | `docs/` |
| Change design for a feature | `plans/` |
| Bug root cause + file map | `.agents/skills/fixed/` |
| Non-derivable decision/context | `memory/` (see `memory/skills.md` — write rarely) |

---

## 6. Docs-as-code

A PR that changes behavior updates its plan status, public MDX / consumer skill (if user-facing),
and architecture notes when layer rules move — in the **same PR**.
