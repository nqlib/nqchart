# Product roadmap

Steering backlog for maintainers and AI agents. Executor plans: `plans/README.md`. Deep review: `plan/IMPROVEMENT_PLAN.md`.

## Completed (plans 001–006)

- Vitest baseline (engine compilers + llm pipeline)
- MCP JSON-RPC parse error handling
- Lockfile / dependency hygiene (pnpm)
- CONTRIBUTING rewrite
- Landing demo dashboard lazy-load
- Landing/docs a11y quick wins

Also completed in full-roadmap pass: cartesian chart factory, color-token migration, motion/TOC tokens, OG route, registry boundary audit, ECharts patch notes (`patches/README.md`).

## Deferred (optional follow-ups)

1. **Narrowed per-chart `CompileContext` types** — `CartesianCompileContext` vs `RadialCompileContext` so `tsc` rejects cross-domain field reads in compilers. Requires test baseline (001) before large refactors.
2. **ECharts 6.x upgrade** — npm latest is 6.1.0; dedicated migration needed. Stay on 5.6.x until then.
3. **next-themes patch audit** — re-check when upgrading past 0.4.6 (`patches/next-themes@0.4.6.patch`).
4. **Dead public prop cleanup** — remove or wire `isClickable`, `glowing`, `bufferBar` on bar parts.
5. **Hover-trace / monospace generalization** — parameterize by `seriesId` for radial/composed reuse.
6. **Install command package-manager switcher** — pnpm/npm/bun/yarn toggle on landing.
7. **Per-chart ECharts module registration** — modest bundle win; breaks standalone registry file story. Document as known limitation.

## Explicitly not planned

- npm package publish for `@beecharts/*` (shadcn registry distribution)
- CMS for landing demo data
- Engine rewrite (architecture is sound)
- Auth/rate-limiting on `/mcp` (public docs)

Pick the first unblocked item when starting new work. Update [[product/ai-contract]] DoD applies to all changes.
