# NQChart — Agent guide

Architecture and skill routing for agents working in this repository.

**Claude Code:** start at [`CLAUDE.md`](./CLAUDE.md) (points here).

## TL;DR

- **Product** = shadcn registry under `src/registry/` (not npm packages)
- **Public docs** = `src/content/docs/` (Fumadocs at `/docs`)
- **Internal vault** = `docs/` (architecture + product EP/ST + roadmap)
- **Capability record** = `docs/product/epics/` (EP/ST — *what/why*)
- **Change design** = `plans/` (required for features — *how*)
- **Shared memory** = `memory/` (on demand; write rarely)
- **Registry must not import** `src/components/**`

## Sequence of execution (anti-drift)

Do **not** skip ahead into `src/` for feature-sized work.

1. **Orient** — this file → [`docs/README.md`](docs/README.md) → load **1–3** skill/docs files (do not bulk-read the vault).
2. **Recall** — skim [`memory/INDEX.md`](memory/INDEX.md) when prior decisions might apply.
3. **Intake** — classify chore / bug / feature ([guideline](docs/product/agentic-coding-guideline.md)).
4. **Product** — programs/features: epic + story in [`docs/product/`](docs/product/README.md) when consumers need a citeable id.
5. **Plan** — features need [`plans/`](plans/README.md) (existing or new from `_template.md`) **approved before** source edits.
6. **Implement** — only the story/plan / bug scope; blueprint first if design is wrong.
7. **Verify** — DoD in [`docs/product/ai-contract.md`](docs/product/ai-contract.md).
8. **Record** — story+plan status; bugs → [`.agents/skills/fixed/`](.agents/skills/fixed/SKILL.md); durable decisions → `memory/` (bar in [`memory/skills.md`](memory/skills.md)).

Full ladder + exemptions: [`docs/product/agentic-coding-guideline.md`](docs/product/agentic-coding-guideline.md).

## Which skill to use

| You are… | Start here |
|----------|------------|
| Integrating NQChart in an **external app** | [skills/consumer/nqchart/SKILL.md](skills/consumer/nqchart/SKILL.md) |
| Changing **engine, registry, examples** | [.agents/skills/nqchart-dev/SKILL.md](.agents/skills/nqchart-dev/SKILL.md) |
| **Fixing bugs / regressions** (search past fixes first) | [.agents/skills/fixed/index.md](.agents/skills/fixed/index.md) |
| Changing **docs site, landing, agent HTTP** | [.agents/skills/nqchart-docs/SKILL.md](.agents/skills/nqchart-docs/SKILL.md) |
| **Glow / shadow / bloom on UI chrome** (TOC diamond, etc.) | [.agents/skills/no-box-glow/SKILL.md](.agents/skills/no-box-glow/SKILL.md) — ask when unclear; no decorative box glow |
| **Remember / recall** durable project facts | [.agents/skills/memory/SKILL.md](.agents/skills/memory/SKILL.md) → [`memory/INDEX.md`](memory/INDEX.md) |
| Understanding **architecture / backlog / intake** | [docs/README.md](docs/README.md) · [docs/index.md](docs/index.md) · [agentic guideline](docs/product/agentic-coding-guideline.md) · [epics](docs/product/README.md) |

Do **not** use the consumer skill when contributing to this repo.

**ECharts option reference** — when writing or debugging compilers, consult [.agents/skills/echarts-ai-skill/SKILL.md](.agents/skills/echarts-ai-skill/SKILL.md) for correct ECharts `option` shapes (`examples/*.option.json`, `src/core/spec-to-option.ts`). It's an **internal dev reference only** — not a consumer skill, and not in the public agent-skills index; build charts via this repo's `compile-*.ts`, never the skill's CLI.

## Skills hub

See [skills/README.md](skills/README.md) for the consumer vs contributor split.

**Charts** — shadcn registry (copies source into your app):

```bash
pnpm dlx shadcn@latest add @nqchart/bar-chart
```

**Agent skill** — skills CLI (markdown guidance only):

```bash
npx skills add ctesibius/nqchart --skill nqchart -y
```

After editing consumer skill in this repo: `pnpm sync:skills`

## Layer rules

```
src/content/docs/     → public MDX reference
src/components/       → site-only UI (never imported by registry)
src/registry/charts/  → NQ*Chart compound roots
src/registry/echarts-core/ → pure compilers + hooks
```

Arrow points down: charts → echarts-core → echarts/core.

## Verification (before PR)

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm run audit:previews
pnpm run audit:registry-boundary
pnpm skill:validate
pnpm build
```

Full DoD: [docs/product/ai-contract.md](docs/product/ai-contract.md).

## Trigger phrases

NQChart, `@nqchart`, registry, compile-*, chart-recipes, ComponentPreview, fumadocs, llms.txt, MCP, shadcn registry, hover flicker, scatter dim, treemap vanish, fixed skill, plan before code, memory/.
