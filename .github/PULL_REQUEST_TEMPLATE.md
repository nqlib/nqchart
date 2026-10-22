<!--
Base branch: `dev` for all work (squash-merge). Into `main` only from `dev` (a release) or
`hotfix/*`, and only with a merge commit.
Title: conventional commit form — `type(scope): summary (ST-NNN)`. The title becomes the
squash-merge subject. Write the body in Simplified Technical English. Do not add AI
attribution (no Co-Authored-By trailer, no "Generated with" footer).
-->

## What changes

<!-- What the PR does, and why. Link the story / plan / fix note. -->

- Story: ST-___ · Plan: plans/___ · Fix note: .agents/skills/fixed/fixes/___

## Type

- [ ] `feat` — new public capability (minor version)
- [ ] `fix` — bug fix (patch version)
- [ ] `perf` / `refactor` — no API change
- [ ] `docs` / `chore` / `ci` / `build`
- [ ] **Breaking** — a prop, type, entry, or peer is removed or renamed

## Screenshots

<!-- Light and dark, for a visual chart or docs-site change. -->

## Checklist

- [ ] `pnpm preflight` exits 0 on the committed branch
- [ ] Plan and story status updated in this PR (`pnpm lint:status`)
- [ ] Public API change: specs / public-surface, MDX page, consumer skill (`pnpm sync:skills`), and changelog updated
- [ ] Registry manifests changed: `pnpm run registry:fresh` run and outputs committed
- [ ] Light/dark spot-check on the affected docs pages
- [ ] Checks that could not run locally are named here:
