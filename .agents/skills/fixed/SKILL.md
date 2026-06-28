---
name: beecharts-fixed
description: >-
  Searchable registry of past BeeCharts bug fixes by domain and symptom. Use when
  fixing regressions, debugging hover/focus, compile-*, ECharts state, flicker, or
  dimming bugs in this repo — search index.md FIRST before inventing a new fix.
skill: beecharts-fixed
kind: skill
metadata:
  author: beecharts
  version: "1.0.0"
---

# BeeCharts — fixed issues (maintainer)

Past fixes for this repository. **Do not guess** when a symptom matches an entry here.

## Mandatory workflow

1. **Search [index.md](./index.md)** — domain table + semantic (symptom) table.
2. Open the linked **domain** file under `domains/` for context.
3. Open the linked **fix** file under `fixes/` for root cause, files, and verification.
4. If no match: fix the bug, then **add a row to `index.md`** and a new file under `fixes/` in the right domain (or create a domain file first).

## Layout

| Path | Purpose |
|------|---------|
| [index.md](./index.md) | Domain index + semantic index — **search here first** |
| [domains/](./domains/) | One file per problem domain (overview + fix links) |
| [fixes/](./fixes/) | One file per resolved incident (root cause + patch map) |

## Related skills

- Engine / compilers: [beecharts-dev](../beecharts-dev/SKILL.md)
- Public hover contract: [hover-focus.mdx](../../../src/content/docs/hover-focus.mdx)
- ECharts option shapes: [echarts-ai-skill](../echarts-ai-skill/SKILL.md)

## Enriching this skill

When you close a non-trivial bug:

1. Pick or create a **domain** (`domains/<domain>.md`) with required [frontmatter](./references/frontmatter.md).
2. Add a **fix note** (`fixes/<domain>-<short-slug>.md`) with symptoms, cause, files, verify steps — same frontmatter rules.
3. Update **both tables** in [index.md](./index.md) (domain row + semantic triggers).
4. Link from the domain file to the new fix.
5. Run `pnpm skill:validate`.

Keep fix notes factual and file-specific — no duplicate prose across domain and fix files.
