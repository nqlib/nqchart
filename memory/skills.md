# memory/ — shared project memory & write policy

`memory/` is the repo's **version-controlled, team-shared** memory: durable facts an agent (or
teammate) should know across sessions that are **not derivable** from the code, git history,
`AGENTS.md`, or `docs/`. This file is the policy — *when, how, and why* to write — so memory stays
small and high-signal. The [memory skill](../.agents/skills/memory/SKILL.md) points here.

> **Not the same as** machine-local agent memory (`~/.claude/…/memory/`, Cursor chat history).
> This one lives in the repo, is shared via git, and is loaded **on demand**.

> **Not the same as** [`.agents/skills/fixed/`](../.agents/skills/fixed/SKILL.md) — that skill is the
> searchable **bug/regression** registry. Chart flicker/hover/compile bug lessons go there, not here.

---

## The bar — write almost never

Before writing, apply:

> **"Would an agent repeat the same mistake or waste the same effort next session without this note?"**
> If **no**, don't write it.

A fact earns a memory file only if **all three** hold:

1. **Durable** — still true in a month (not current branch / WIP / today's task).
2. **Not derivable** — can't be recovered from code, `git log`, `AGENTS.md`, or `docs/`.
3. **Reusable** — a *future* session on this repo would benefit.

Fail any one → **don't write**. Default outcome of a turn: *no memory written*.

---

## When to write

- User says **"remember / save this / note for later / add to memory"** → capture the durable nugget.
- A **decision + rationale** that will resurface ("we chose X over Y because Z").
- **Domain / distribution knowledge** not obvious from code (registry model, publish constraints).
- A **gotcha that cost real time**, so the next session skips the dead end.
- A **team convention** about *how we work* that is not already in `AGENTS.md` / product docs.

## When NOT to write

- Anything **derivable** from code, git, `AGENTS.md`, or existing `docs/`.
- **Bug fix root causes** → [`.agents/skills/fixed/`](../.agents/skills/fixed/SKILL.md) instead.
- **One-off** chat detail or **transient** state.
- Restating a doc → *update that doc* instead.
- **Secrets**, PII, tokens, `.env` values.
- Multi-step procedures that belong in a **skill** or path-scoped Cursor rule.
- Machine-local paths (`/Users/…`, `~/Desktop/…`) — write so any clone can apply it.

---

## Categories (`type` in frontmatter)

| `type` | What belongs | Body shape |
|--------|--------------|------------|
| `domain` | How the library/distribution really works | plain statement |
| `decision` | A choice + why + how to apply later | **Why:** / **How to apply:** |
| `context` | Ongoing project constraints / goals not in docs | plain statement |
| `convention` | Team norm on *how we work* | **Why:** / **How to apply:** |
| `reference` | Pointer to an external resource | link + one line |

---

## How to write

1. **One fact per file** → `memory/<kebab-slug>.md`.
2. **Frontmatter:**
   ```markdown
   ---
   name: <kebab-slug>
   description: <one line — used to judge relevance during recall>
   type: domain | decision | context | convention | reference
   created: YYYY-MM-DD
   ---
   ```
3. **Body** under ~150 words. `decision` / `convention` include **Why:** and **How to apply:**.
   Absolute dates only. Paths **repo-relative**. User-agnostic voice.
4. **Add one line to [`INDEX.md`](./INDEX.md)** (see its format).
5. Skim `INDEX.md` first — update or delete stale memories; do not duplicate.

## How to recall

Read **`INDEX.md`** (cheap), then open only the files whose `description` matches the task.
**Never bulk-read** `memory/`. Keep `INDEX.md` under ~200 lines.

## Loading

- [`AGENTS.md`](../AGENTS.md) routes here; consult `INDEX.md` when a task might benefit from prior context.
- Repo memory is **not** auto-injected every session (token budget).
