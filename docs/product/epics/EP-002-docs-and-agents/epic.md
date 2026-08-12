---
id: EP-002
title: Docs site, skills, agent HTTP
status: done
target: 2026-Q2
owner: nqchart
---

# EP-002 — Docs site, skills, agent HTTP

## Goal

Make NQChart **discoverable and agent-operable**: Fumadocs reference with live previews,
a consumer Agent Skill, `llms.txt` / MCP, and maintainer skills for this repo.

## Scope — In

- `src/content/docs/` MDX + `ComponentPreview`
- `skills/consumer/nqchart/` → `pnpm sync:skills`
- `/llms.txt`, `/mcp`, `/.well-known/agent-skills/`
- Landing demo dashboard

## Scope — Out

- CMS for demo data
- Auth on MCP

## Stories (retrospective)

| ID | Title | Status |
|----|-------|--------|
| ST-005 | Fumadocs chart pages + previews | done |
| ST-006 | Consumer skill + sync pipeline | done |
| ST-007 | MCP + llms.txt agent surfaces | done |
| ST-008 | Landing a11y / lazy demo | done (plans 005–006) |

## Dependencies

EP-001.
