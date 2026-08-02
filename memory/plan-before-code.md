---
name: plan-before-code
description: Feature-sized work needs a plan in plans/ (or approval of an existing one) BEFORE source edits
type: convention
created: 2026-08-01
---

For **feature-sized** work (new chart API, engine behavior change, docs-site capability, multi-file
refactor), author or update a plan under `plans/` and get developer approval **before** editing
`src/`. Chores, typo docs, and single-bug fixes that match `.agents/skills/fixed/` are exempt.

**Why:** chat-only plans drift; a repo plan is the change-design SSOT and keeps agents from inventing
scope. Full ladder: `docs/product/agentic-coding-guideline.md`.

**How to apply:** search `plans/README.md` + `docs/product/roadmap.md` first; if none covers the
request, add `plans/NNN-kebab-name.md` from `plans/_template.md`, present it, wait for approval, then
implement. Mark status IN-PROGRESS → DONE in the same PR.
