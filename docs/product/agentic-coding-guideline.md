# Agentic coding guideline (maintainers)

How agents and humans keep NQChart from drifting: **intake → product record → plan → implement → verify → record**.

Companion docs:

| Doc | Role |
|-----|------|
| Root [`AGENTS.md`](../../AGENTS.md) | Orientation + skill routing |
| [`docs/README.md`](../README.md) | Vault index |
| [[product/philosophy]] · [[product/specs]] | Beliefs + API promise |
| [[product/README]] | Epic / story index (EP/ST) |
| [[product/ai-contract]] | Definition of done |
| [[product/roadmap]] | Deferred / not-planned |
| [`plans/README.md`](../../plans/README.md) | Technical blueprints (the *how*) |
| [`memory/INDEX.md`](../../memory/INDEX.md) | Durable non-code lessons |
| [`.agents/skills/fixed/`](../../.agents/skills/fixed/SKILL.md) | Bug / regression search |

This is a **library** repo. We use **both**:

- **EP/ST** in `docs/product/epics/` — capability record (*what/why*), SecoLab-compatible
- **`plans/NNN-*.md`** — change design (*how*), still **required** before feature `src/` edits

Chat-only plans are not enough. Epics without a linked plan are not enough to start coding.

---

## 1. Sequence of execution (do not skip)

```
1. Orient     → AGENTS.md → docs/README.md → load 1–3 skill/docs files
2. Recall     → memory/INDEX.md if prior decisions might apply
3. Intake     → classify size; find epic/story and/or plan home
4. Product    → for programs: EP + ST (create if missing); link consumer stories if any
5. Plan       → features need plans/NNN-*.md approved before source edits
6. Implement  → only the story/plan scope; blueprint first if design is wrong
7. Verify     → DoD in ai-contract.md
8. Record     → story+plan status; bugs → fixed/; durable decisions → memory/ (rare)
```

**Blueprint discipline:** if implementation shows the design is wrong, **stop**, update the
plan (and architecture / specs if the promise moved), then continue.

---

## 2. Decision ladder (intake)

| Size | Examples | Home before code |
|------|----------|------------------|
| **Chore** | Typo, comment, dep bump with no API change | None |
| **Bug** | Hover flicker, wrong compile output | Search **fixed** first |
| **Small fix** | One-file polish, no contract change | None if under ~1 hour |
| **Feature** | New chart API, compiler behavior, docs capability | **Story (ST)** + **`plans/NNN-*.md`** |
| **Program** | Multi-phase capability (e.g. BI readiness) | **Epic (EP)** + stories + plans |

Hard rule: **no feature lands without a row in `plans/README.md`.**  
Programs should also appear in [[product/README]] so consumers (and SecoLab) can cite ST ids.

---

## 3. Intake — work with no home yet

**Feature / program:**

1. Search [[product/README]] and `plans/README.md`.
2. **Found story + plan** → set statuses `in-progress` / `IN-PROGRESS`, implement that scope.
3. **Found plan only** → attach or mint an ST under the right epic (or create EP), then code.
4. **Not found** → draft EP/ST from `product/epics/_templates/` and `plans/NNN` from
   `_template.md`, get approval, **then** edit `src/`.

**Bug:**

1. Search `.agents/skills/fixed/index.md`.
2. Fix + fix-note in the same PR (`pnpm skill:validate`).

---

## 4. ID rules

- Epic: `EP-NNN` global, never reused. Next free: see [[product/README]].
- Story: `ST-NNN` global, never reused.
- Plan: `NNN` zero-pad 3 under `plans/`.
- A story's frontmatter `plan:` field points at its blueprint when one exists.

---

## 5. Memory vs fixed vs docs vs product

| Kind | Where |
|------|--------|
| Philosophy / specs / epics | `docs/product/` |
| Architecture | `docs/architecture/` |
| Change design for a feature | `plans/` |
| Bug root cause + file map | `.agents/skills/fixed/` |
| Non-derivable decision | `memory/` (write rarely) |

---

## 6. Docs-as-code

Same PR updates: story + plan status, specs/public-surface when the API promise moves,
public MDX / consumer skill when user-facing, architecture when layer rules move.

See [`docs/conventions.md`](../conventions.md).
