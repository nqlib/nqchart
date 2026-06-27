---
name: scaffold-docs-and-agent-skills
description: >-
  Set up a library repo with an internal docs vault, a consumer agent skill,
  maintainer skills, and HTTP skill discovery. Use when asked to scaffold docs/,
  skills/, agent skills, llms.txt, or .well-known/agent-skills for a library.
---

# Scaffold docs + agent skills

**Goal:** A library repo where (1) humans read public API docs, (2) external agents get a consumer skill to integrate the library, (3) maintainer agents get separate skills with a clear DoD, and (4) one source of truth syncs to local agent dirs and HTTP.

## Audience split — never mix

| | Consumer skill | Maintainer skill(s) |
|--|----------------|---------------------|
| **Who** | Teams using the library in **their** app | People changing **this** repo |
| **Covers** | Install → API usage → verify in app | Layers, build pipeline, docs site, DoD |
| **Must NOT cover** | Repo internals, registry build | How to integrate in an external app |

If engine and docs site are separate surfaces, split maintainers into `<name>-dev` and `<name>-docs`.

## Layout

```
<repo>/
├── docs/                      # Internal vault — why/where (not public API prose)
│   ├── index.md
│   ├── architecture/
│   ├── product/roadmap.md
│   ├── product/ai-contract.md # Maintainer DoD
│   └── meta/llm-usage.md, publishing.md
├── skills/
│   ├── README.md              # Audience table + install commands
│   └── consumer/<name>/       # ★ ONLY edit consumer skill here (SOT)
│       ├── SKILL.md
│       └── *.md references
├── .agents/skills/            # or .cursor/skills/
│   ├── <name>-dev/SKILL.md
│   └── <name>-docs/SKILL.md
├── AGENTS.md                  # Repo router: which skill for which task
└── <public-docs>/             # MDX/site — API reference only
```

**Rule:** `docs/` summarizes and links; do not duplicate public doc pages into the vault.

## Consumer SKILL.md

Frontmatter (required):

```yaml
---
name: <skill-name>
description: >-
  <What agents do + trigger terms>. NOT for contributing to this repository.
license: MIT
compatibility: <Runtime deps>
metadata:
  author: <org>
  version: "1.0.0"
---
```

Body (in order): product one-liner → read-order table → **success gates** table → workflow/decision tree → non-negotiables → minimal code sample → anti-patterns.

Keep SKILL.md ≤150 lines; detail goes in sibling `.md` or `references/`.

**Success gates example:**

| Gate | Check |
|------|-------|
| Installed | Package/registry CLI ran; peers present |
| API | Config keys match data fields |
| Renders | Works in target environment |

## Maintainer SKILL.md

Frontmatter must say **NOT for external app integration**.

Body: cross-link `-docs` / consumer SOT → in/out scope table → dependency rules → numbered workflow → DoD checklist (same as `docs/product/ai-contract.md`) → verification commands.

## Sync (single source of truth)

Edit `skills/consumer/<name>/` only. Script copies to:

1. `.agents/skills/<name>/` — skills CLI / local agents
2. `public/.well-known/agent-skills/<name>/` — HTTP static bundle
3. Regenerate `public/.well-known/agent-skills/index.json` from SKILL.md `description`

```json
"sync:skills": "node scripts/sync-consumer-skills.mjs",
"skill:validate": "node scripts/validate-skills.mjs",
"build": "<sync:skills> && ..."
```

`skill:validate`: every SKILL.md has frontmatter with `name` and `description`.

HTTP routes must **read the SOT file** — never maintain a second inline copy.

## Agent HTTP checklist

- [ ] `/.well-known/agent-skills/index.json` (agentskills.io schema)
- [ ] `/.well-known/agent-skills/<name>/SKILL.md` + reference `.md` files
- [ ] `/llms.txt` — curated doc links
- [ ] Per-page markdown for agents (`/llm/*.md` or equivalent)
- [ ] Optional `/mcp` for doc search

## Root AGENTS.md

~60 lines: layer rules → table (external app → consumer; engine → `-dev`; docs → `-docs`) → links to `docs/index.md`, `skills/README.md` → verification commands.

## Install paths (pick one per repo)

| How users get the library | How agents get the skill |
|---------------------------|--------------------------|
| npm package with bundled skill | Package CLI `skill install` + sync into package tarball |
| GitHub repo | `npx skills add org/repo --skill <name> -y` |
| Registry CLI only (e.g. shadcn) | Skills CLI from repo; library via separate install docs |

Monorepo with separate docs app: consumer SOT stays at repo root `skills/consumer/`; `-docs` skill documents the docs app paths.

## Execution order

1. `docs/index.md` + vault folders (seed from CONTRIBUTING, not MDX)
2. `skills/README.md` + `skills/consumer/<name>/`
3. `<name>-dev` and `<name>-docs` maintainer skills
4. Root `AGENTS.md`
5. Sync + validate scripts; wire build
6. HTTP routes read SOT
7. CONTRIBUTING + public install page mention skills
8. Run verification below

## Verification

```bash
pnpm sync:skills && pnpm skill:validate
pnpm lint && pnpm exec tsc --noEmit
pnpm test   # if present
pnpm build
```

Confirm: HTTP SKILL.md matches SOT; consumer and maintainer skills do not overlap scope.

## Anti-patterns

- One skill for consumers and maintainers
- Editing synced copies under `.agents/skills/<name>/` instead of SOT
- Duplicate inline skill generator that drifts from SKILL.md
- Maintainer skill that teaches external integration
- Public API prose copied into internal vault
