# BeeCharts — documentation vault

Internal architecture and product notes for **maintainers**. Open in Obsidian (or any editor) and follow `[[wikilinks]]`.

Public API reference lives in **`src/content/docs/`** (Fumadocs at `/docs`).

## Start here

| Topic | Note |
|--------|------|
| Layer boundaries | [[architecture/overview]] |
| Import rules | [[architecture/dependency-rules]] |
| Chart catalog | [[registry/chart-catalog]] |
| Registry build | [[registry/build-pipeline]] |
| Compile pipeline | [[engine/compile-context]] |
| BI data helpers | [[engine/chart-recipes]] |
| Product backlog | [[product/roadmap]] |
| Maintainer DoD | [[product/ai-contract]] |
| Consumer agent skill | `skills/consumer/beecharts/` · `npx skills add ctesibius/beecharts --skill beecharts -y` |
| Agent HTTP / MCP | [[meta/llm-usage]] |
| Deploy / registry | [[meta/publishing]] |

## Layers

- `src/registry/echarts-core/` — pure compile fns, hooks, color/animation tokens
- `src/registry/charts/` — public `Bee*Chart` compound components
- `src/registry/ui/` — chart shell pieces shipped via registry
- `src/registry/examples/` + `blocks/` — docs previews and CLI blocks
- `src/components/` — **site-only** (docs chrome, landing); never imported by registry

## Related

- **Public docs site** — `src/content/docs/` (not this vault)
- **Executor plans** — `plans/README.md`
- **Improvement roadmap** — `plan/IMPROVEMENT_PLAN.md`
- **Repo agent router** — root `AGENTS.md`
- **Contributor skills** — `.agents/skills/beecharts-dev/`, `.agents/skills/beecharts-docs/`
