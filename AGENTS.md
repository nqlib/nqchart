# BeeCharts — Agent guide

Architecture and skill routing for agents working in this repository.

## TL;DR

- **Product** = shadcn registry under `src/registry/` (not npm packages)
- **Public docs** = `src/content/docs/` (Fumadocs at `/docs`)
- **Internal vault** = `docs/` (maintainer architecture + roadmap)
- **Registry must not import** `src/components/**`

## Which skill to use

| You are… | Start here |
|----------|------------|
| Integrating BeeCharts in an **external app** | [skills/consumer/beecharts/SKILL.md](skills/consumer/beecharts/SKILL.md) |
| Changing **engine, registry, examples** | [.agents/skills/beecharts-dev/SKILL.md](.agents/skills/beecharts-dev/SKILL.md) |
| Changing **docs site, landing, agent HTTP** | [.agents/skills/beecharts-docs/SKILL.md](.agents/skills/beecharts-docs/SKILL.md) |
| Understanding **architecture / backlog** | [docs/index.md](docs/index.md) |

Do **not** use the consumer skill when contributing to this repo.

## Skills hub

See [skills/README.md](skills/README.md) for the consumer vs contributor split.

**Charts** — shadcn registry (copies source into your app):

```bash
pnpm dlx shadcn@latest add @beecharts/bar-chart
```

**Agent skill** — skills CLI (markdown guidance only):

```bash
npx skills add ctesibius/beecharts --skill beecharts -y
```

After editing consumer skill in this repo: `pnpm sync:skills`

## Layer rules

```
src/content/docs/     → public MDX reference
src/components/       → site-only UI (never imported by registry)
src/registry/charts/  → Bee*Chart compound roots
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

BeeCharts, `@beecharts`, registry, compile-*, chart-recipes, ComponentPreview, fumadocs, llms.txt, MCP, shadcn registry.
