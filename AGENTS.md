<!-- Generated copy of CLAUDE.md for non-Claude coding agents. Do not edit directly: edit CLAUDE.md, then run `pnpm sync:agents` (see docs/conventions.md). -->
# CLAUDE.md

**Primary agent index** for Claude Code, Cursor, Codex, and other agents in **nqchart**.
Read this file first. Then load the 1–3 files that the task routing table gives for your task.
The documentation map is **`docs/README.md`**. Every maintainer doc is reachable from it.

`AGENTS.md` is a generated copy of this file. Edit `CLAUDE.md`, then run `pnpm sync:agents`.

## How to write to the developer — read this before you answer

**Write every response in Simplified Technical English (ASD-STE100).** This rule applies to
every response, in every task, including short ones.

The rules:

- Use the active voice. Use simple tenses.
- Write short sentences. Use maximum 20 words in an instruction. Use maximum 25 words in a
  description.
- Give one instruction in each sentence.
- Keep one topic in each paragraph. Use maximum 6 sentences in a paragraph.
- Use each word with one meaning.
- Do not omit the articles ("the", "a").
- Use the imperative mood for instructions.
- Put a warning before the step it applies to.

**Do not do these things:**

- Do not join clauses with a dash to make a long sentence look short.
- Do not use a rhetorical question, or a phrase such as "and here is the thing".
- Do not repeat a fact in a new form for emphasis.
- Do not write a paragraph that explains why the answer is clever.
- Do not use a metaphor. Say what the code does.

Technical names, code identifiers, and quoted code are exempt.

Apply STE when you create or edit:

- Commit **bodies** and PR bodies
- Epics, stories, and plans (`docs/product/epics/**`, `plans/**`)
- Rules (`CLAUDE.md`, `docs/conventions.md`, `docs/product/ai-contract.md`, skills)
- Changelog entries (`src/content/docs/changelog.mdx`)
- Other `docs/**` and `src/content/docs/**` prose that this PR already touches

Do not rewrite a file that this PR does not already touch.

These keep their own shape:

- The conventional commit **subject** (`feat(charts): …`)
- Frontmatter and status tables
- The one-line user-story frame (`As a` / `I want` / `so that`)
- Code, code comments, and generated files (`registry.json`, `src/registry/__index__.tsx`)

## What this is

`nqchart` is a React chart library on Apache ECharts with a compound `NQ*Chart` API.

- **Users install the npm package `@nqlib/nqchart`.** This is the primary distribution. Each
  chart family has a subpath entry (`@nqlib/nqchart/bar-chart`). React, ECharts, and Motion
  are peer dependencies.
- **The shadcn registry is a secondary path.** It copies the same `src/registry/` source into
  an app (`shadcn add @nqchart/<chart>`). Keep it working. Do not design for it first.
- **The docs site** is a Next.js + Fumadocs app. It serves the public reference (`/docs`), the
  registry JSON (`/r/*.json`), `llms.txt`, `/mcp`, and the agent skills.

| Path | Role |
|------|------|
| `src/registry/` | **The product.** The source of the npm package and the registry |
| `src/registry/echarts-core/` | The engine: pure compilers (`compile-*.ts`) and hooks |
| `src/registry/charts/` | The public `NQ*Chart` compound roots |
| `src/registry/ui/` | Chart shell UI that ships to users (legend, tooltip, shell) |
| `src/lib/public.ts` | The npm root entry |
| `src/components/` | Docs-site UI only. The registry never imports it |
| `src/content/docs/` | Public MDX reference (what users read) |
| `docs/` | Maintainer vault: architecture, product (EP/ST), conventions |
| `plans/` | Change design for features (the *how*) |
| `memory/` | Durable decisions that the code does not show |
| `skills/consumer/nqchart/` | Source of the consumer agent skill |

## Task routing — load 1–3 files, do not bulk-read

| Task | Load |
|------|------|
| Engine, compiler, registry item, example, chart-recipes | skill `.agents/skills/nqchart-dev/` |
| ECharts `option` shape in a compiler | `.agents/skills/echarts-ai-skill/SKILL.md`. Reference only. Do not use its CLI |
| Bug, regression, hover flicker, dim, vanish, label clip | `.agents/skills/fixed/index.md` first → the fix note → then the code |
| MDX page, landing page, `llms.txt`, `/mcp`, agent HTTP | skill `.agents/skills/nqchart-docs/` |
| Docs-site visual design | `PRODUCT.md` + `DESIGN.md` |
| Glow, shadow, bloom on UI chrome | `.agents/skills/no-box-glow/SKILL.md`. Ask when the context is unclear |
| Public API change (a prop, a type, an entry, a peer) | `docs/architecture/public-surface.md` → `docs/product/specs.md` → § Public API below |
| Import or layer question | `docs/architecture/dependency-rules.md` · `docs/architecture/layers.md` |
| New feature or program | `docs/product/agentic-coding-guideline.md` → `plans/README.md` → `docs/product/README.md` |
| Consumer agent skill | `skills/README.md`. Edit `skills/consumer/nqchart/`, then run `pnpm sync:skills` |
| Release, version bump, npm publish, tag | `docs/meta/publishing.md` · `docs/conventions.md` § Release |
| Branch, commit, PR | `docs/conventions.md` § Git |
| Recall or save shared project memory | `memory/INDEX.md` → skill `.agents/skills/memory/`. Write policy: `memory/skills.md` |
| Integrate NQChart in an **external** app | `skills/consumer/nqchart/SKILL.md`. Do not use it for work in this repo |

## Sequence of execution

Do not skip ahead into `src/` for feature-sized work.

1. **Orient.** Read this file. Load 1–3 files from the routing table.
2. **Recall.** Read `memory/INDEX.md` when a prior decision can apply.
3. **Intake.** Classify the work as chore, bug, small fix, feature, or program
   (`docs/product/agentic-coding-guideline.md` § 2).
4. **Product.** For a program, write or find the epic and the stories.
5. **Plan.** For a feature, write or find `plans/NNN-*.md`. Get approval before you edit `src/`.
6. **Implement.** Do only the scope of the story, the plan, or the bug. If the design is wrong,
   stop and update the plan first.
7. **Verify.** Run `pnpm preflight`. Do the manual checks in `docs/product/ai-contract.md`.
8. **Record.** Update the plan and story status in the same PR. Write a bug fix note in
   `.agents/skills/fixed/`. Write a durable decision in `memory/` only if it passes the bar.

## Layer rules

```
src/registry/charts/        → NQ*Chart compound roots
src/registry/echarts-core/  → pure compilers + hooks
echarts/core                → the only ECharts import path
```

- The arrow points down. A lower layer never imports a higher layer.
- `src/registry/**` must not import `src/components/**`. `pnpm run audit:registry-boundary`
  fails the build on a violation.
- Compilers are pure functions. Do not call a hook in `compile-*.ts`.
- Do not import the full `echarts` package. Import from `echarts/core`. Each chart family
  registers only the ECharts modules that it draws (plan 016).
- Do not use `any` in `src/registry/echarts-core/`.
- Use one primitive per chart family. A BI shape (histogram, Pareto, gauge) is a recipe and an
  example, not a new chart component.

## Shared rules

- **Language:** see **How to write to the developer** at the top of this file.
- **Package manager:** use pnpm 10.12.1 only. Do not use npm, yarn, or bun to install or run
  scripts in this repo.
- **Git — `dev` → `main`.** `dev` is where work collects. `main` is the latest npm release and
  nothing else. Release tags (`vX.Y.Z`) on `main` mark the published versions.
  - Branch from `origin/dev`. Name the branch `<type>/<short-name>`, for example
    `feat/017-hover-focus-opt-out` or `fix/pie-table-blank`. Put the plan number in the name
    when a plan exists.
  - **Before the first edit:** confirm that the branch was cut from `dev` and is named for
    this task. Stop if it is not. A hotfix is the only branch cut from `main`.
  - Open a PR into `dev`. **Squash-merge into `dev`.** Delete the branch after the merge.
  - **A release is a PR from `dev` into `main`. Merge it with a merge commit. Never squash
    into `main`.** A squash writes a new commit, and `main` and `dev` then drift apart. Tag the
    merge commit on `main`.
  - **Hotfix:** branch `hotfix/<name>` from `origin/main`, PR into `main` (merge commit), tag a
    patch. Then open a PR from `main` into `dev` (merge commit) so `dev` gets the fix.
  - Only `dev` and `hotfix/*` may open a PR into `main`. CI job `branch-flow` fails any other
    PR into `main`, and fails a push to `main` that is not a merge commit.
  - **Never push directly to `main` or `dev`.**
  - **One branch and one PR per task.** **A merged PR is finished.** Never push to its branch
    again. More work goes on a new branch from `origin/dev`.
  - Use conventional commit subjects: `type(scope): summary`. Types: `feat`, `fix`, `perf`,
    `refactor`, `docs`, `test`, `chore`, `ci`, `build`. Scopes: `charts`, `engine`,
    `registry`, `docs`, `site`, `skills`, `pkg`, `ci`, `deps`. A release subject is
    `chore(release): vX.Y.Z — <summary>`.
  - Commit only when the developer asks.
  - Full workflow: `docs/conventions.md` § Git.
- **No AI attribution in any git artifact.** Do not write a `Co-Authored-By: Claude …` trailer
  in a commit. Do not put a "Generated with Claude Code" footer in a PR body. The same ban
  applies to Cursor: do not write `Co-authored-by: Cursor` or `Made-with: Cursor`. This rule
  overrides the agent harness default, which adds both. A squash-merge joins the commit
  messages of the branch, so one trailer on one commit reaches `dev`. Always write the
  squash-merge subject and body by hand (`gh pr merge --squash --subject … --body-file …`).
  `scripts/git-hooks/commit-msg` removes a trailer before git stores the commit. Install the
  hooks once per clone with `pnpm hooks:install`. `pnpm lint:attribution` fails a PR that still has
  one.
- **Build and run CI locally first. GitHub CI is the last gate, not the test bench.** Each
  Actions run costs money. A CI failure on a check that can run here is a failure of the
  push, not of CI.
  1. Commit first. `scripts/preflight.mjs` reads the committed diff against `origin/dev`
     (`origin/main` for a `hotfix/*` branch).
  2. Run `pnpm preflight`. It runs the same steps as `ci.yml` for the areas that the branch
     changes, including `build:npm` and the site build. Run `pnpm preflight --full` before a
     release.
  3. Push only when the command exits 0. Read the exit code, not the printed lines. A pipe
     such as `cmd | tail` returns the exit code of its last command.
  4. The `pre-push` hook (`pnpm hooks:install`) runs preflight again if the pushed commit has
     no recorded pass, and blocks the push on a failure. **Never use `git push --no-verify`.**
  5. Batch the commits. Push when the change is ready to check, not after each commit. Each
     push to an open PR starts a CI run.
  6. Open a PR as a **draft** while the work is in progress. A draft PR runs no paid CI job.
     Mark it ready when preflight passes.
  7. If a check cannot run here, name it in the PR body. Tell the developer before the push.

  Do not push to see what CI says. Do not push a fix that you did not run here. If CI fails on
  a check that passed here, find why the two differ and fix the local check.
- **CI waits:** do not poll CI in the foreground. Wait with one
  `gh pr checks <n> --watch --fail-fast` call in a background job. Report the result when it
  exits.
- **Public API:** the npm package is the contract. A PR that changes an exported prop, type,
  entry, or peer also updates, in the same PR:
  `docs/product/specs.md` or `docs/architecture/public-surface.md`, the public MDX page, the
  consumer skill (`skills/consumer/nqchart/`, then `pnpm sync:skills`), and the changelog.
  `pnpm run build:npm` runs `check:api`, which type-probes `dist/types/`. An additive change is
  a minor version. A removed or renamed prop is a major version (a minor version while the
  package is `0.x`).
- **Docs-as-code:** a PR that changes behavior updates its docs in the same PR. This includes
  the plan status, the story status, and the epic status when the epic closes.
  `pnpm lint:status` fails when the plan index, a plan file, a story, and its epic disagree.
- **Generated files:** `src/registry/__index__.tsx` and `registry.json` are generated and
  committed. Regenerate them with `pnpm run registry:fresh`. Do not edit them by hand. Do not
  edit synced skill copies (`.agents/skills/nqchart/`, `.claude/skills/`,
  `public/.well-known/agent-skills/`). Edit the source and run `pnpm sync:skills`.
- **Plans:** a plan lives in `plans/NNN-kebab-name.md` and has a row in `plans/README.md`.
  Old plans live in `plans/_archive/`. Do not create a plan file in another folder.
- **Memory:** `memory/` holds durable decisions and context that the code, git, and this file
  do not show. Read `memory/INDEX.md` when a task can use prior context. The bar is high: most
  turns write nothing. Follow `memory/skills.md`. A bug lesson goes in
  `.agents/skills/fixed/`, not in `memory/`.
- **Secrets:** never read or commit `.env` files, npm tokens, or credentials. Do not paste an
  npm OTP into a file.
- **Subagents:** delegate wide searches and read-only sweeps to the `Explore` agent. Do not
  delegate edits.
