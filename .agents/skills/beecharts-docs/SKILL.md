---
name: beecharts-docs
description: >-
  Builds and extends the BeeCharts documentation site (Fumadocs + Next.js).
  Covers MDX pages, ComponentPreview wiring, landing, agent HTTP routes,
  and llms.txt. Use when adding docs, installation pages, or agent surfaces
  in this repo. Pair with beecharts-dev for registry/engine work; do not use
  the consumer skill in this repo.
metadata:
  author: beecharts
  version: "1.0.0"
---

# BeeCharts — documentation site skill

> Engine/registry: see [beecharts-dev](../beecharts-dev/SKILL.md).  
> Consumer integration: see [skills/consumer/beecharts](../../../skills/consumer/beecharts/SKILL.md).

## Layout

```
beecharts/
├── src/app/              # Next.js routes: landing, /docs, /llm, /llms.txt, /mcp, /.well-known
├── src/content/docs/     # Fumadocs MDX (public reference)
├── src/components/docs/  # MDX components, previews, sidebar
├── src/registry/examples/# Preview components → ComponentPreview
├── src/lib/agent-docs.ts # llms.txt, skill index, MCP helpers
├── docs/                 # Internal maintainer vault (not public MDX)
└── skills/consumer/      # Consumer skill SOT → pnpm sync:skills
```

## Stack

| Layer | Location |
|-------|----------|
| Public docs | `src/content/docs/*.mdx` + `meta.json` nav |
| Previews | `src/registry/examples/ex-*.tsx` → `<ComponentPreview name="ex-…" />` |
| Agent HTTP | `src/lib/agent-docs.ts`, `src/lib/llm.ts`, `src/app/mcp/` |
| Landing | `src/components/landing/`, `src/app/page.tsx` |
| Internal notes | `docs/` vault |

## Workflow: add a doc page with live preview

1. Add registry example in `src/registry/examples/ex-my-chart.tsx` (coordinate with beecharts-dev).
2. Register in `src/registry/registry-example.ts`.
3. Run `pnpm run registry:fresh`.
4. Add/update MDX under `src/content/docs/<chart>/static.mdx`.
5. Add slug to `src/content/docs/meta.json` if new top-level page.
6. Verify: `pnpm run audit:previews`.

## Agent surfaces

| Surface | File |
|---------|------|
| `/llms.txt` | `generateLlmsTxt()` in `agent-docs.ts` |
| `/llms-full.txt` | `generateLlmsFullTxt()` |
| `/llm/*.md` | `src/app/llm/[[...slug]]/route.ts` |
| `/skill.md` | Canonical consumer skill (reads SOT) |
| `/.well-known/agent-skills/` | Synced from `skills/consumer/beecharts/` + maintainer skills |
| `/mcp` | `src/app/mcp/route.ts` |

Legacy `/.well-known/skills/*` paths redirect to `/.well-known/agent-skills/*` (see `next.config.ts`).

After editing consumer skill: `pnpm sync:skills` (updates `.agents/skills/beecharts/` and `public/.well-known/`).

## Skills / installation docs

- `src/content/docs/installation.mdx` — shadcn + skills CLI steps
- `src/components/docs/mdx/components/skills-block.tsx` — install UI
- `skills/README.md` — audience split for maintainers

## Dev commands

```bash
pnpm dev
pnpm run registry:fresh
pnpm sync:skills
pnpm run audit:previews
pnpm build
```

## Checklist

- [ ] MDX preview names match registry examples (`audit:previews` green).
- [ ] New pages in `meta.json` if needed.
- [ ] `IMPORTANT_DOCS` in `agent-docs.ts` updated for high-priority llms.txt links.
- [ ] Consumer skill SOT updated if install flow changed; run `pnpm sync:skills`.
