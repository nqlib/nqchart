# Plans index — beecharts improvement program

Written by an advisor session on **2026-06-10** against commit **`f43ccf9`** (branch `landing-redesign-and-theme`). Each plan is self-contained: an executor needs no other context. Plans were selected non-interactively as the top findings by leverage (impact ÷ effort, weighted by confidence) — the user did not pick a subset; adjust if priorities differ.

Related artifact: `../IMPROVEMENT_PLAN.md` (an earlier design/architecture review from the previous session). Plans 005 and 006 formalize items from it into executor-grade specs; its remaining items appear under "Deferred candidates" below.

## Status

| # | Plan | Category | Effort | Status |
|---|------|----------|--------|--------|
| 001 | [Test baseline (Vitest) for engine + LLM pipeline](001-test-baseline-vitest.md) | tests / ci | M | DONE |
| 002 | [MCP route: JSON-RPC error handling](002-mcp-route-error-handling.md) | correctness | S | DONE |
| 003 | [Lockfile hygiene + remove unused deps](003-lockfile-and-dependency-hygiene.md) | dx / deps | S | DONE |
| 004 | [Rewrite CONTRIBUTING.md (pnpm + ECharts reality)](004-rewrite-contributing.md) | docs | M | DONE |
| 005 | [Landing: lazy-load the 4-chart demo dashboard](005-landing-lazy-demo-dashboard.md) | performance | S–M | DONE |
| 006 | [Landing/docs a11y quick wins](006-landing-a11y-quick-wins.md) | a11y | S–M | DONE |

Executors: update Status to IN-PROGRESS / DONE / BLOCKED (with one-line reason) as you work.

## Recommended execution order & dependencies

```
001 (tests)  ──────────────►  [future engine refactors — see deferred]
002 (mcp)         independent; its optional unit test depends on 001
003 (hygiene)     independent — do before 004
004 (contributing) after 003 (and after 001 if it lands, so docs mention `pnpm test`)
005 (landing perf) independent
006 (a11y)        independent; trivial overlap with 005 in src/app/page.tsx — if run
                  concurrently, expect a 1-line merge in the hero section
```

No plan here is risky enough to require 001 first, but **001 must land before any engine refactor** (chart factory, CompileContext narrowing) is attempted.

## Deferred candidates (vetted, not yet planned)

Completed in the full-roadmap pass (2026-06-10): engine factory + `CompileRootFields` domain grouping, color-token migration + dark palette fix, motion/TOC tokens, `noUncheckedIndexedAccess`, OG route, CI cache, registry escaping, ECharts investigation (`patches/README.md`).

Remaining optional follow-ups:

1. **Narrowed per-chart `CompileContext` types** — `CartesianCompileContext` vs `RadialCompileContext` so `tsc` rejects cross-domain field reads in compilers.
2. **ECharts 6.x upgrade** — npm latest is 6.1.0; requires dedicated migration (not a patch bump). Stay on 5.6.x until then.
3. **next-themes patch audit** — re-check when upgrading `next-themes` past 0.4.6.

## Considered and rejected (do not re-audit)

- **MCP path traversal** — `getPageByPath` (`src/app/mcp/route.ts:64-72`) is a `.find()` over the fumadocs page list; user input never touches the filesystem. By design, safe.
- **"Fresh clone breaks without registry build"** — false: `src/registry/__index__.tsx` and `registry.json` are committed; `postinstall` generates `.source/`. The committed-generated-files model is unconventional but coherent.
- **"eslint missing react-hooks rules"** — `eslint-config-next/core-web-vitals` already includes them.
- **ReDoS in `src/lib/llm.ts`** — patterns are non-greedy with literal terminators and run over repo-controlled MDX only; not exploitable.
- **`--path` token unused** — false; used via `text-path` in `toc-indicator.tsx:144` and `nav-main.tsx:42,50`.
- **Per-chart ECharts module registration** (instead of the global `echarts-init.ts` list) — modest bundle win, breaks the registry's standalone-file story. Known limitation.
- **Removing `@carbon/icons-react` / `@mantine/hooks` / `@base-ui/react` / `embla-carousel-react`** — all verified in use (2, 2, 3, 1 files respectively). Consolidation is a product decision, not hygiene.
- **Auth/rate-limiting on `/mcp`** — serves public docs; complexity not justified until abuse is observed.
- **An agent-reported claim that echarts "5.10+" exists** — unverified version number; treat any echarts upgrade as an investigate item (deferred #8), not a fact.

## Verification gates (used by all plans)

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm skill:validate
pnpm run audit:previews
pnpm run audit:registry-boundary
pnpm build            # runs sync:skills + registry:fresh + next build
```

Package manager is **pnpm 10.12.1** (enforced via the `packageManager` field) — never npm/yarn/bun.

## Audit coverage note

Covered across two sessions: engine architecture, docs/landing architecture, color tokens/theming, motion/spacing, correctness, security (request-time routes, scripts, secrets scan), tests, DX/tooling/CI, dependencies, performance (landing/docs), direction. **Not audited:** runtime behavior under load, cross-browser rendering, the 24 MDX docs pages' prose accuracy, registry payload installation end-to-end in a consumer project (`shadcn add` smoke test), and `public/r` generated output correctness beyond what `audit:previews` checks.
