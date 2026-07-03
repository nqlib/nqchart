# NQChart — Agent guide

Architecture and skill routing for agents working in this repository.

## TL;DR

- **Product** = shadcn registry under `src/registry/` (not npm packages)
- **Public docs** = `src/content/docs/` (Fumadocs at `/docs`)
- **Internal vault** = `docs/` (maintainer architecture + roadmap)
- **Registry must not import** `src/components/**`

## Which skill to use

| You are… | Start here |
|----------|------------|
| Integrating NQChart in an **external app** | [skills/consumer/nqchart/SKILL.md](skills/consumer/nqchart/SKILL.md) |
| Changing **engine, registry, examples** | [.agents/skills/nqchart-dev/SKILL.md](.agents/skills/nqchart-dev/SKILL.md) |
| **Fixing bugs / regressions** (search past fixes first) | [.agents/skills/fixed/index.md](.agents/skills/fixed/index.md) |
| Changing **docs site, landing, agent HTTP** | [.agents/skills/nqchart-docs/SKILL.md](.agents/skills/nqchart-docs/SKILL.md) |
| Understanding **architecture / backlog** | [docs/index.md](docs/index.md) |

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

NQChart, `@nqchart`, registry, compile-*, chart-recipes, ComponentPreview, fumadocs, llms.txt, MCP, shadcn registry, hover flicker, scatter dim, treemap vanish, fixed skill.
