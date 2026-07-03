# Plan 003 — Lockfile hygiene + remove confirmed-unused dependencies

- **Status:** TODO
- **Written against commit:** `f43ccf9` (branch `landing-redesign-and-theme`)
- **Effort:** S · **Risk of change:** low · **Priority:** 3

## Why this matters

The repo (`nqchart`, Next.js app, package manager **pnpm 10.12.1** per the `packageManager` field) currently carries three lockfiles and several dependencies with zero imports:

- `pnpm-lock.yaml` — canonical; CI (`.github/workflows/ci.yml`) runs `pnpm install --frozen-lockfile`.
- `bun.lock` — **tracked in git** (verified via `git ls-files`), stale (predates recent dependency changes). A contributor running `bun install` would silently diverge from CI.
- `package-lock.json` — exists locally but is already gitignored (`.gitignore` line 5) and NOT tracked. Local cruft only.

Confirmed-unused runtime dependencies (verified: zero imports under `src/`, zero references in `src/registry/registry-*.ts` manifests and `registry.json`):

| package.json line | Dependency | Imports found |
|---|---|---|
| 33 | `@number-flow/react@^0.5.11` | 0 |
| 80 | `react-dnd@^16.0.1` | 0 |
| 83 | `react-resizable-panels@^4.0.14` | 0 |

Do **not** remove these look-alikes — they ARE used: `embla-carousel-react` (used by `src/components/ui/carousel.tsx`), `@carbon/icons-react` (2 files), `@mantine/hooks` (2 files), `@base-ui/react` (3 files). Consolidating icon/hook libraries is a separate product decision, out of scope here.

## Verification commands

`pnpm lint` · `pnpm exec tsc --noEmit` · `pnpm build` (runs `registry:fresh` + `next build`).

## Steps

### Step 1 — Re-confirm the three deps are unused at execution time

Code may have changed since this plan was written. Run:

```bash
rg -l --fixed-strings "@number-flow" src
rg -l --fixed-strings "react-dnd" src
rg -l --fixed-strings "react-resizable-panels" src
rg --fixed-strings "react-dnd" registry.json src/registry/registry-*.ts
```

All commands must return nothing. If ANY returns a hit, drop that package from the removal list and note it in your report — do not refactor the usage away.

### Step 2 — Remove the unused dependencies

```bash
pnpm remove @number-flow/react react-dnd react-resizable-panels
```

This updates `package.json` and `pnpm-lock.yaml` together.

**Verify:** `pnpm exec tsc --noEmit && pnpm lint && pnpm build` all exit 0.

### Step 3 — Remove stray lockfiles and prevent recurrence

```bash
git rm bun.lock          # tracked — remove from the index and disk
rm -f package-lock.json  # untracked local file
```

Append to `.gitignore` (it already ignores `package-lock.json` on line 5 — keep that; add the bun entries next to it):

```
bun.lock
bun.lockb
yarn.lock
```

**Verify:** `git ls-files | grep -E "bun.lock|package-lock|yarn.lock"` returns nothing; `git status` shows only intended changes.

### Step 4 — Full gate

```bash
pnpm install --frozen-lockfile   # proves lockfile is self-consistent, mirrors CI
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

## Done criteria (machine-checkable)

1. `node -e "const d=require('./package.json').dependencies; process.exit(['@number-flow/react','react-dnd','react-resizable-panels'].some(k=>d[k])?1:0)"` exits 0.
2. `git ls-files | grep -c "bun.lock"` outputs 0.
3. `.gitignore` contains `bun.lock`.
4. `pnpm install --frozen-lockfile` exits 0.
5. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` all exit 0.

## Scope boundaries

- **In scope:** `package.json` (dependency removal only), `pnpm-lock.yaml`, `bun.lock` (delete), `package-lock.json` (delete, untracked), `.gitignore`.
- **Out of scope — do not touch:** any file in `src/`, any other dependency (no version bumps, no `pnpm update`, no removal of `@carbon/icons-react` / `@mantine/hooks` / `@base-ui/react` / `embla-carousel-react`), `patches/` (the next-themes patch stays), CI workflow, `pnpm.overrides` / `patchedDependencies` blocks in package.json.

## Escape hatches — STOP and report if:

- `pnpm remove` rewrites unrelated sections of `pnpm-lock.yaml` so broadly that `--frozen-lockfile` fails afterward — report the pnpm version you ran with (must be 10.12.1 via corepack/packageManager).
- `pnpm build` fails after removal with a module-not-found error mentioning one of the removed packages — that means a dynamic/string-based import the rg sweep missed. Re-add that package (`pnpm add <pkg>@<the exact prior version from this plan's table>`) and report where it's referenced.
- Removing `bun.lock` is rejected because it's referenced by some tooling config (search `.github/`, `vercel.json`, `turbo.json` if present) — report the reference.

## Test plan

No new tests — covered by build/typecheck gates plus `pnpm install --frozen-lockfile` (CI parity).

## Maintenance note

A deeper unused-dependency sweep (e.g. with `knip`) across the remaining ~65 runtime deps is a reasonable follow-up but needs case-by-case judgment (registry payload deps, peer-dep relationships) — it was deliberately excluded here to keep this change zero-risk. If someone adds a Bun- or npm-based workflow later, they must remove the corresponding `.gitignore` entries consciously.
