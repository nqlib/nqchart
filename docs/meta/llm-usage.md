# LLM / agent integration

How external coding agents consume NQChart documentation and skills.

## Human docs

- Site: `https://nqchart.vercel.app/docs`
- Source: `src/content/docs/*.mdx`

## Agent surfaces

| URL | Purpose |
|-----|---------|
| `/llms.txt` | Curated link index |
| `/llms-full.txt` | Full MDX snapshot |
| `/llm/{slug}.md` | Per-page markdown |
| `/skill.md` | **Canonical** consumer skill entry (reads SOT at build time) |
| `/.well-known/agent-skills/index.json` | **Canonical** agentskills.io discovery index |
| `/.well-known/agent-skills/nqchart/SKILL.md` | Consumer skill (agentskills.io path) |
| `/mcp` | JSON-RPC: `search_docs`, `read_doc` |

Implementation: `src/lib/agent-docs.ts`, `src/lib/llm.ts`.

### Legacy URLs (redirect → canonical)

| Legacy | Redirects to |
|--------|----------------|
| `/.well-known/skills/index.json` | `/.well-known/agent-skills/index.json` |
| `/.well-known/skills/nqchart/skill.md` | `/.well-known/agent-skills/nqchart/SKILL.md` |

The old skills index used a custom schema with `install` / `docs` fields; use the agentskills.io index instead.

## Install consumer skill (recommended)

```bash
npx skills add ctesibius/nqchart --skill nqchart -y
```

Source of truth: `skills/consumer/nqchart/` (synced to `.agents/skills/nqchart/` and `public/.well-known/agent-skills/nqchart/`).

For contributing to this repo, use `nqchart-dev` / `nqchart-docs` — not the consumer skill.

## shadcn registry install

```bash
pnpm dlx shadcn@latest add @nqchart/bar-chart
```

Requires `echarts` and registry namespace in `components.json`. See `/docs/installation`.

## Maintainer note

After editing consumer skill files, run:

```bash
pnpm sync:skills
```

CI fails if synced copies drift from SOT. See `skills/README.md` for audience boundaries.
