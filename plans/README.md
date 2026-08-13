# Plans index — change design (NQChart)

**Change-design SSOT** for feature-sized work. Agents: read
[`docs/product/agentic-coding-guideline.md`](../docs/product/agentic-coding-guideline.md) —
**plan before `src/` edits** for features; chores/bugs exempt.

**Product record (EP/ST):** [`docs/product/README.md`](../docs/product/README.md) — epics &
stories are the *what/why*; this folder is the *how*. Feature work should link both.

| Role | Path |
|------|------|
| New plan template | [`_template.md`](./_template.md) |
| Product backlog | [`docs/product/roadmap.md`](../docs/product/roadmap.md) |
| DoD | [`docs/product/ai-contract.md`](../docs/product/ai-contract.md) |

Next id = highest `NNN` below + 1. Add a row when you create a plan; keep **Status** in sync.

---

## Historical program (001–006)

Written by an advisor session on **2026-06-10** against commit **`f43ccf9`**. Each plan is
self-contained. Related: `../plan/IMPROVEMENT_PLAN.md`.

## Status

| # | Plan | Category | Effort | Status |
|---|------|----------|--------|--------|
| 001 | [Test baseline (Vitest) for engine + LLM pipeline](001-test-baseline-vitest.md) | tests / ci | M | DONE |
| 002 | [MCP route: JSON-RPC error handling](002-mcp-route-error-handling.md) | correctness | S | DONE |
| 003 | [Lockfile hygiene + remove unused deps](003-lockfile-and-dependency-hygiene.md) | dx / deps | S | DONE |
| 004 | [Rewrite CONTRIBUTING.md (pnpm + ECharts reality)](004-rewrite-contributing.md) | docs | M | DONE |
| 005 | [Landing: lazy-load the 4-chart demo dashboard](005-landing-lazy-demo-dashboard.md) | performance | S–M | DONE |
| 006 | [Landing/docs a11y quick wins](006-landing-a11y-quick-wins.md) | a11y | S–M | DONE |
| 007 | [Funnel: horizontal orient + smooth pipe connections](007-funnel-horizontal-pipe.md) | engine / funnel | L | DONE |
| 008 | [Funnel: `sort` prop + data-order default](008-funnel-sort-prop.md) | engine / funnel | S | DONE |
| 009 | [BI interaction API: mark click, legend selection, brush range](009-bi-interaction-api.md) | engine / api | M | DONE |
| 010 | [BI axes: tick formatters, dual axis everywhere, scale types](010-bi-axes-and-formatting.md) | engine / api | M | DONE |
| 011 | [Reference lines, bands, and `<Area>` in composed charts](011-bi-annotations-and-marks.md) | engine / api | M | DONE |
| 012 | [Empty/error states, keyboard access, and export](012-bi-states-a11y-export.md) | a11y / dx | M | DONE |
| 013 | [BI-readiness acceptance test plan (verifying 009–012)](013-bi-readiness-acceptance-test-plan.md) | tests / release | S | DONE |
| 014 | [Make the interaction API consumable (unblock 0.3.0)](014-make-the-interaction-api-consumable.md) | engine / api | S | DONE |
| 015 | [BI ship leftovers (waterfall, funnel, harness, series id)](015-bi-ship-leftovers.md) | engine / api | M | DONE |
| 016 | [Per-family ECharts registration, honest export, internals check](016-echarts-payload.md) | performance / dist | M | VERIFY — ready to tag v0.3.1; owner publishes |

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
007 (funnel)      independent; Phase A (orient) then Phase B (pipe custom series)
```

No plan here is risky enough to require 001 first, but **001 must land before any engine refactor** (chart factory, CompileContext narrowing) is attempted.

## BI-readiness program (009–012)

Written 2026-08-11 after a consumer (`secolab`) attempted to migrate its dashboard renderer
onto NQChart 0.2.2 and stopped. The blocker and the six smaller API findings are recorded in
plan 009 and 010.

```
009 (interaction)  ─┬─►  011 (annotations)   needs 010's axis-binding helper
                    └─►  012 (states/a11y)   needs 009's mark-event helper
010 (axes)         ─┘
```

**014 is the release gate.** 009–012 are implemented but 009 is not consumable — three roots
declare standalone props types that omit `onMarkClick`. 013 is how you verify a release; 014
is what makes one possible. The manual surface for both is `/charts/lab` in `nqui-showcase`
(its plan 001), run via `pnpm dev:local:charts`.

009 and 010 are independent of each other and are the two that unblock the consumer
migration — 009 restores the *features* (cross-filter, drill), 010 restores *parity* (that
app already ships per-axis tick formatting on recharts, which NQChart cannot yet match).
Do both before asking anyone to migrate. 011 and 012 are what make the library a BI
renderer rather than a chart renderer.

**Headline finding:** most of the interaction capability already exists internally —
`useChartBrush` returns a range with an `onChange`, and `NQChartLegend` accepts `selected` /
`onSelectChange`. Neither reaches the public API. Only mark click is genuinely new. That is
why 009 is M and not L.

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
- ~~**Per-chart ECharts module registration**~~ — reversed in [016](016-echarts-payload.md). The old objection was extras living in a shared init file. Declaring extras in the family file keeps a shadcn copy self-contained and is what the npm per-entry build needs.
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
