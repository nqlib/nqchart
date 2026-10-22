---
name: memory
description: >-
  Read or write shared project memory in memory/. Use when the user says remember,
  save this, note for later, add to memory, what do we know about X, or after a durable
  decision worth persisting. Strict bar — most turns write nothing. NOT for chart bugs
  (use nqchart-fixed) and NOT for anything already in AGENTS.md or docs/.
---

# Project memory (NQChart)

Shared, version-controlled memory lives in **`memory/`**. Full policy:
[`memory/skills.md`](../../../memory/skills.md) — read it before any non-trivial write.

## The bar

> Would an agent repeat the same mistake next session without this note? If no → don't write.

Persist only if **durable**, **not derivable** (code / git / `AGENTS.md` / `docs/`), and **reusable**.
Default: write nothing.

**Bugs / regressions** → [`.agents/skills/fixed/`](../fixed/SKILL.md), not here.

## Write (when the bar passes)

1. One fact → `memory/<kebab-slug>.md` with frontmatter (`name`, `description`, `type`, `created`).
2. Skim [`memory/INDEX.md`](../../../memory/INDEX.md) — update, don't duplicate.
3. Add one index line: `- [Title](file.md) — hook · type`.
4. Keep under ~150 words; repo-relative paths only; no secrets.

## Recall

Read **`memory/INDEX.md`**, then only matching files. Never bulk-read `memory/`.
