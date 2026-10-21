# Contributing to NQChart

Thanks for your interest in contributing! NQChart is a React chart library built on **Apache ECharts**. Users install the npm package **`@nqlib/nqchart`**. The same source (`src/registry/`) also ships as shadcn registry JSON on the docs site, as a secondary install path.

Agents: start at [`CLAUDE.md`](CLAUDE.md). Git, release, and docs rules: [`docs/conventions.md`](docs/conventions.md).

## Prerequisites

- **Node.js 22** (matches CI)
- **pnpm 10.12.1** — enforced via the `packageManager` field. Run `corepack enable` if needed.

## Setup

```bash
git clone https://github.com/nqlib/nqchart.git
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
  registry/       # THE PRODUCT — source of the npm package and the registry
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

## Quality gates (run before you push)

Commit first, then run:

GitHub Actions minutes cost money, so CI is the last gate. Build and check locally first:

```bash
pnpm hooks:install      # once per clone: commit-msg (strips AI attribution) + pre-push (preflight)
pnpm preflight          # the CI checks for the areas your branch changes
pnpm preflight --full   # every check, including build:npm and next build (releases)
```

The `pre-push` hook blocks a push when preflight has not passed on the pushed commit. Do not
bypass it with `--no-verify`. Open a PR as a draft while you work: a draft PR runs no paid CI
job. Push in batches, not after each commit.

`pnpm preflight` reads the committed diff against `origin/dev` (`origin/main` on a `hotfix/*`
branch). Push only when it exits 0.
CI (`.github/workflows/ci.yml`) runs the same checks.

## Agent skills

NQChart ships agent skills for coding assistants. **Edit source files only** — synced copies are generated.

| Audience | Source of truth | Synced to |
|----------|-----------------|-----------|
| Consumers (external apps) | `skills/consumer/nqchart/` | `.agents/skills/nqchart/`, `public/.well-known/agent-skills/nqchart/` |
| Contributors (engine/registry) | `.agents/skills/nqchart-dev/` | `public/.well-known/agent-skills/nqchart-dev/`, `.claude/skills/nqchart-dev/` |
| Contributors (docs site) | `.agents/skills/nqchart-docs/` | `public/.well-known/agent-skills/nqchart-docs/`, `.claude/skills/nqchart-docs/` |
| Contributors (fixes, memory, no-box-glow) | `.agents/skills/<name>/` | `.claude/skills/<name>/` |

```bash
pnpm sync:skills       # after editing consumer skill
pnpm skill:validate    # check SKILL.md frontmatter
```

- Internal maintainer vault: `docs/index.md`
- Repo agent rules: root `CLAUDE.md` (`AGENTS.md` is a generated copy — run `pnpm sync:agents`)
- Skills hub: `skills/README.md`

When changing public chart API or install flow, update `skills/consumer/nqchart/` and run `pnpm sync:skills`.

## Code style

- TypeScript **strict** mode
- Kebab-case filenames (`compile-bar.ts`, `lazy-mount.tsx`)
- **Named exports** in the registry; no default exports in engine code
- Prettier with `prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`
- No `any` in `src/registry/echarts-core/` — keep it that way

## Pull requests

NQChart has two long-lived branches. `dev` collects the work for the next release and is the
default branch. `main` holds the latest npm release only. Full rules:
[`docs/conventions.md`](docs/conventions.md) § Git.

- Branch from `origin/dev`: `feat/NNN-<name>`, `fix/<name>`, `docs/<name>`, `chore/<name>`.
- Open a PR into `dev` and **squash-merge** it. Never push directly to `dev` or `main`.
- Use one logical change per PR. A merged PR is finished; put more work on a new branch.
- Title the PR in conventional commit form: `type(scope): summary (ST-NNN)`.
- Do not add AI attribution (`Co-Authored-By: Claude …`, "Generated with …") to a commit or a PR.
- Include light and dark screenshots for a visual chart or landing change.
- Update `CONTRIBUTING.md` if you add or rename `package.json` scripts.

## Release

A release moves `dev` into `main` with a **merge commit** (never a squash), then a tag:

1. Branch `release/vX.Y.Z` from `origin/dev`.
2. Bump `package.json` `version`. Add notes to `src/content/docs/changelog.mdx`. Update the
   current version in `src/content/docs/installation.mdx` and `README.md`.
3. Close the plans and stories that the release ships (`pnpm lint:status`).
4. Run `pnpm preflight --full`.
5. PR `chore(release): vX.Y.Z — <summary>` into `dev`; squash-merge it.
6. PR `dev` → `main` titled `release: vX.Y.Z — <summary>`; merge it with a **merge commit**.
7. Tag the merge commit on `main`: `git tag -a vX.Y.Z -m "nqchart X.Y.Z — …"` then
   `git push origin vX.Y.Z`.
8. **Separate step for the owner:** `pnpm publish:npm` (OTP as needed). A tag does not publish.

**Hotfix** (a bug in the published version that cannot wait): branch `hotfix/<name>` from
`origin/main`, PR into `main` (merge commit), tag and publish a patch, then PR `main` → `dev`
(merge commit). **Pre-release:** publish `X.Y.Z-beta.N` from `dev`; it goes to the `next`
dist-tag. Details: [`docs/conventions.md`](docs/conventions.md) § Release · `docs/meta/publishing.md`.

## Questions

Open a [GitHub issue](https://github.com/nqlib/nqchart/issues) for bugs or feature requests.
