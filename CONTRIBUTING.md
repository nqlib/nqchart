# Contributing to NQChart

Thanks for your interest in contributing! NQChart is a **shadcn-style chart registry** built on **Apache ECharts** — the deliverable is installable source under `src/registry/`, not a separate npm chart package.

## Prerequisites

- **Node.js 22** (matches CI)
- **pnpm 10.12.1** — enforced via the `packageManager` field. Run `corepack enable` if needed.

## Setup

```bash
git clone https://github.com/ctesibius/nqchart.git
cd nqchart
pnpm install   # runs postinstall: fumadocs-mdx (generates .source/)
pnpm dev
```

Site: `http://localhost:3000`

## Repository layout

```
src/
  app/            # Next.js routes: landing, /docs, /llm/*.md, /llms.txt, /mcp
  components/     # Site-internal UI (docs chrome, landing, shadcn primitives)
  content/docs/   # MDX documentation (fumadocs)
  registry/       # THE PRODUCT — installable chart components
    echarts-core/ # Engine: compilers, hooks, animation tokens, color resolution
    charts/       # Public NQ*Chart components
    ui/           # Chart-adjacent UI shipped via registry (chart shell, legend, tooltip)
    examples/     # Docs example components
    blocks/       # Larger composed blocks
  scripts/        # build-registry.mts, audit-doc-previews.mjs
  lib/            # Site lib (llm.ts, agent-docs.ts, registry.ts, source.ts)
```

**Generated files:** `src/registry/__index__.tsx` and `registry.json` are built by `registry:build` but **committed**. `public/r/` and `.source/` are generated and **gitignored**. A fresh clone typechecks without extra steps.

## `components/ui` vs `registry/ui`

- `src/components/ui/` — shadcn primitives for **this docs site only**. Not exported via the registry.
- `src/registry/ui/` — chart shell pieces users install with `shadcn add @nqchart/*`.

Registry code must **not** import from `src/components/**`. Run `pnpm run audit:registry-boundary` to verify.

Charts use **ECharts** through `src/registry/echarts-core/` — never import `recharts` (migration is complete).

## Adding or changing a chart

1. Edit or add files under `src/registry/` (charts, examples, ui as needed).
2. Register the item in the matching `src/registry/registry-*.ts` manifest.
3. Regenerate the registry index:

```bash
pnpm run registry:fresh
```

4. Commit regenerated `src/registry/__index__.tsx` and `registry.json`.
5. Verify docs ↔ registry consistency:

```bash
pnpm run audit:previews
```

6. Add or update the MDX page in `src/content/docs/` with `<ComponentPreview name="..." />`.

## Quality gates (run before opening a PR)

```bash
pnpm run lint
pnpm exec tsc --noEmit
pnpm test
pnpm run audit:previews
pnpm run audit:registry-boundary
pnpm run build
```

CI (`.github/workflows/ci.yml`) runs the same checks plus `pnpm audit --audit-level=high`.

## Agent skills

NQChart ships agent skills for coding assistants. **Edit source files only** — synced copies are generated.

| Audience | Source of truth | Synced to |
|----------|-----------------|-----------|
| Consumers (external apps) | `skills/consumer/nqchart/` | `.agents/skills/nqchart/`, `public/.well-known/agent-skills/nqchart/` |
| Contributors (engine/registry) | `.agents/skills/nqchart-dev/` | `public/.well-known/agent-skills/nqchart-dev/` |
| Contributors (docs site) | `.agents/skills/nqchart-docs/` | `public/.well-known/agent-skills/nqchart-docs/` |

```bash
pnpm sync:skills       # after editing consumer skill
pnpm skill:validate    # check SKILL.md frontmatter
```

- Internal maintainer vault: `docs/index.md`
- Repo agent router: root `AGENTS.md`
- Skills hub: `skills/README.md`

When changing public chart API or install flow, update `skills/consumer/nqchart/` and run `pnpm sync:skills`.

## Code style

- TypeScript **strict** mode
- Kebab-case filenames (`compile-bar.ts`, `lazy-mount.tsx`)
- **Named exports** in the registry; no default exports in engine code
- Prettier with `prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`
- No `any` in `src/registry/echarts-core/` — keep it that way

## Pull requests

- Branch from `main` (or the active integration branch).
- One logical change per PR when possible.
- Include screenshots for visual chart or landing changes.
- Update `CONTRIBUTING.md` if you add or rename `package.json` scripts.

## Questions

Open a [GitHub issue](https://github.com/ctesibius/nqchart/issues) for bugs or feature requests.
