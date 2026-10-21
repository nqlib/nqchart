# Conventions — git, PRs, releases, and docs

New or edited prose in this file uses Simplified Technical English (`CLAUDE.md` § How to
write to the developer).

## Git

### Branch model — `dev` → `main`

There are two long-lived branches:

| Branch | Holds | Deploys |
|--------|-------|---------|
| `dev` | The work for the next release. The GitHub default branch | Vercel preview |
| `main` | The latest npm release and nothing else | Vercel production (the public docs) |

```
feat/… ─┐ squash                      merge commit
fix/…  ─┼──────────► dev ──────────────────────────► main ──► tag vX.Y.Z ──► npm publish
docs/… ─┘              ▲                                │
                       └──── merge commit (back-merge) ─┘   after a hotfix only
hotfix/… ─────────────────── merge commit ─────────────► main
```

Daily work:

1. Fetch: `git fetch origin`.
2. Branch from `origin/dev`: `git switch -c <type>/<short-name> origin/dev`.
3. Commit the work. Run `pnpm preflight`.
4. Push and open a PR into `dev`.
5. Squash-merge when CI is green. Write the squash subject and body by hand.
6. Delete the branch.

Merge methods:

| PR | Merge method | Why |
|----|--------------|-----|
| A work branch into `dev` | **Squash** | One commit for each task on `dev` |
| `dev` into `main` (release) | **Merge commit** | `main` keeps the commits of `dev`. The two branches do not drift apart |
| `hotfix/*` into `main` | **Merge commit** | Every commit on `main` is a merge commit |
| `main` into `dev` (back-merge after a hotfix) | **Merge commit** | `dev` gets the fix with the same commit, not a copy |

**Never squash into `main`.** A squash writes a new commit that `dev` does not have. The next
release then conflicts, and the fix needs a forced merge. A merge commit avoids this.

Branch names:

| Kind | Pattern | Base | PR into |
|------|---------|------|---------|
| Feature with a plan | `feat/NNN-<name>` | `dev` | `dev` |
| Bug fix | `fix/<name>` | `dev` | `dev` |
| Docs, chore, CI | `docs/<name>`, `chore/<name>`, `ci/<name>` | `dev` | `dev` |
| Release prep | `release/vX.Y.Z` | `dev` | `dev` |
| Hotfix | `hotfix/<name>` | `main` | `main` |

Rules:

- Never push directly to `main` or `dev`.
- Only `dev` and `hotfix/*` may open a PR into `main`.
- Use one branch and one PR for each task.
- A merged PR is finished. Do not push to its branch again. Put more work on a new branch from
  `origin/dev`.
- Do not stack a branch on an unmerged branch. Wait for the squash-merge, then branch from
  `origin/dev`.

Enforcement: the CI job `branch-flow` fails a PR into `main` from any other branch. It also
fails a push to `main` whose head is not a merge commit. Set the same rules in the GitHub
branch rulesets: `main` allows only merge commits, `dev` allows only squash, and both require a
PR and green CI.

The `Released` branch is retired. Tags on `main` replace it.

### Commit and PR titles

Use a conventional commit subject: `type(scope): summary`. The squash-merge subject is the PR
title, so the PR title uses the same form.

| Type | Use |
|------|-----|
| `feat` | A new public capability (a minor version) |
| `fix` | A bug fix (a patch version) |
| `perf` | A performance change with no API change |
| `refactor` | A code change with no behavior change |
| `docs` | Docs only (vault, MDX, skills) |
| `test` | Tests only |
| `build`, `ci`, `chore` | Tooling, CI, dependencies, housekeeping |

Scopes: `charts`, `engine`, `registry`, `docs`, `site`, `skills`, `pkg`, `ci`, `deps`.

- Put the story or plan id at the end of the subject when one exists:
  `feat(charts): hoverFocus opt-out on every root (ST-023)`.
- Write the subject in the imperative mood. Keep it under 72 characters.
- Write the body in STE. Say what changed and why.
- A breaking change adds `!` after the scope (`feat(charts)!: …`) and a `BREAKING CHANGE:`
  paragraph in the body.

### No AI attribution

Do not write AI attribution in a commit, a PR title, or a PR body:

- No `Co-Authored-By: Claude …` trailer.
- No "Generated with Claude Code" footer.
- No `Co-authored-by: Cursor` or `Made-with: Cursor` trailer.

A squash-merge into `dev` joins the commit messages of the branch. Always pass a hand-written
`--subject` and `--body-file` to `gh pr merge --squash`.

Enforcement:

- `scripts/git-hooks/commit-msg` removes these lines before git stores the commit. Install it
  once per clone with `pnpm hooks:install`.
- `pnpm lint:attribution` fails when a commit on the branch, or the PR body, contains one. CI
  runs it on each PR.

## Release

A release moves `dev` into `main`, then a tag marks it. The npm publish is a separate step
for the owner.

1. Branch `release/vX.Y.Z` from `origin/dev`.
2. Bump `version` in `package.json`.
3. Add the release notes to `src/content/docs/changelog.mdx`. Update the current version in
   `src/content/docs/installation.mdx` and the **Latest** section of `README.md`.
4. Set the plan and story statuses that the release closes to `DONE` / `done`.
5. Run `pnpm preflight --full`. It includes `build:npm` (`check:dist`, `check:api`,
   `check:internals`, `check:size`).
6. Open a PR from `release/vX.Y.Z` into `dev` with the title
   `chore(release): vX.Y.Z — <summary>`. Squash-merge it.
7. Open a PR from `dev` into `main` with the title `release: vX.Y.Z — <summary>`.
   **Merge it with a merge commit. Do not squash.**
8. Tag the merge commit on `main`:
   `git switch main && git pull --ff-only`, then
   `git tag -a vX.Y.Z -m "nqchart X.Y.Z — <summary>"` and `git push origin vX.Y.Z`.
9. The owner runs `pnpm publish:npm`. A tag does not publish.

### Hotfix

Use a hotfix only for a bug in the published version that cannot wait for the next release.

1. Branch `hotfix/<name>` from `origin/main`.
2. Fix the bug. Bump the patch version and add a changelog entry.
3. Run `pnpm preflight` (it compares against `origin/main` on a `hotfix/*` branch).
4. Open a PR into `main`. Merge it with a merge commit.
5. Tag the merge commit on `main` and publish, as in the release steps 8–9.
6. Open a PR from `main` into `dev`. Merge it with a merge commit. Resolve conflicts on `dev`
   in favor of the newer code on `dev`, but keep the fix.

### Pre-release (optional)

To let a consumer test before a release, publish a pre-release from `dev`:

1. Set `version` to `X.Y.Z-beta.N` on a `release/vX.Y.Z-beta.N` branch, and merge it into `dev`.
2. Run `pnpm publish:npm`. A `-beta.N` version publishes to the `next` dist-tag, so `latest`
   stays on the release. Consumers opt in with `pnpm add @nqlib/nqchart@next`.
3. Do not tag a pre-release on `main`.

### Version rules

Version rules while the package is `0.x`:

- A bug fix with no API change is a patch (`0.3.2` → `0.3.3`).
- A new prop, a new entry, or a removed prop is a minor (`0.3.x` → `0.4.0`).

Full publish notes: [`meta/publishing.md`](meta/publishing.md).

## Docs-as-code

A PR that changes behavior updates, in the **same PR**:

1. The owning **story** status (and the epic status when the epic closes), for product work.
2. The **`plans/NNN-*.md`** status and its row in `plans/README.md`, when a feature blueprint
   lands.
3. **Architecture** notes when layer rules or the public surface move.
4. **Public MDX**, the consumer skill, and the changelog when the user-facing API changes.

`pnpm lint:status` checks items 1 and 2. CI runs it on each PR.

Do not leave the vault describing a world the code no longer implements.

### Status values

| Record | Values |
|--------|--------|
| Plan (`- **Status:**` line and the `plans/README.md` row) | `TODO` · `IN-PROGRESS` · `VERIFY` · `DONE` · `BLOCKED` · `CANCELLED` |
| Story (frontmatter `status:`) | `backlog` · `ready` · `in-progress` · `review` · `done` · `blocked` · `cancelled` |
| Epic (frontmatter `status:`) | `planned` · `in-progress` · `done` · `cancelled` |

- A story is `done` only when its plan is `DONE`.
- An epic is `done` only when all of its story files are `done` or `cancelled`.
- A release closes its stories. Do not leave a story in `review` after its version is tagged.

## Wikilinks vs paths

Obsidian-style `[[wikilinks]]` are fine inside `docs/`. Prefer relative markdown links
when the reader may be on GitHub (`[architecture/system](architecture/system.md)`).

## Naming

| Kind | Pattern |
|------|---------|
| Epic folder | `product/epics/EP-NNN-kebab-name/` |
| Epic file | `epic.md` with YAML frontmatter |
| Story file | `stories/ST-NNN-kebab-name.md` |
| Plan | `plans/NNN-kebab-name.md` (zero-pad 3) |
| Archived plan | `plans/_archive/<name>.md` |

IDs are **global and never reused**. Next free ids: see [`product/README.md`](product/README.md).

## Agent rule files

`CLAUDE.md` is the source. `AGENTS.md` is a generated copy for Cursor, Codex, and other agents.
Edit `CLAUDE.md`, then run `pnpm sync:agents`. CI fails when `AGENTS.md` is out of date.

## Tone

Write outcome-first. State an explicit **In / Out** scope. Name the blocker when there is one.
Record what a check already found, so the next pass does not find it again.
