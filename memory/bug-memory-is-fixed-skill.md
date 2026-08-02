---
name: bug-memory-is-fixed-skill
description: Chart bug/regression lessons belong in .agents/skills/fixed/, not memory/
type: convention
created: 2026-08-01
---

When closing a non-trivial **bug** (hover flicker, label clip, compile regression), update
`.agents/skills/fixed/` (search `index.md` first; add domain + fix note). Do **not** duplicate that
into `memory/`.

**Why:** fixed is symptom-searchable and file-mapped for engine work; memory is for non-derivable
decisions/context. Mixing them makes both noisier.

**How to apply:** bugs → fixed skill; product/process decisions → `memory/` (bar in `memory/skills.md`).
