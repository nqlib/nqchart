# AI working contract (maintainers)

**WHAT to build** and **when it's done**. Layer rules: [[architecture/dependency-rules]]. Backlog: [[product/roadmap]].

Do **not** use this contract for external app integration — use the consumer skill at `skills/consumer/nqchart/`.

## Definition of done (every PR)

- [ ] `pnpm lint` passes
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm test` passes (if touching engine or llm)
- [ ] `pnpm run audit:previews` passes (if touching registry or MDX previews)
- [ ] `pnpm run audit:registry-boundary` passes (if touching registry)
- [ ] `pnpm skill:validate` passes (if touching `skills/` or `.agents/skills/nqchart-*`)
- [ ] `pnpm run registry:fresh` run and outputs committed (if registry manifests changed)
- [ ] Light/dark spot-check on affected chart docs pages
- [ ] Skills updated if public API or install flow changed (see `skills/README.md`)

## Workflow (registry changes)

1. Edit `src/registry/` + register in `registry-*.ts`.
2. Add/update `src/registry/examples/ex-*.tsx`.
3. Wire `<ComponentPreview />` in matching `src/content/docs/<chart>/static.mdx`.
4. Run verification gates above.
5. Update consumer skill if user-facing API changed (`skills/consumer/nqchart/`).
6. Run `pnpm sync:skills` before commit if consumer skill changed.

## Hard rules

1. One primitive per chart family — no duplicate BI chart modules.
2. Registry must not import `src/components/**`.
3. Compilers stay pure — no hooks in `compile-*.ts`.
4. Examples on primitive doc pages only — no duplicate doc nav slugs.
5. Do not edit synced copies under `.agents/skills/nqchart/` — edit `skills/consumer/nqchart/` and sync.

## Skills routing

| Task | Skill |
|------|-------|
| Engine, registry, examples | `.agents/skills/nqchart-dev/` |
| MDX, landing, agent HTTP | `.agents/skills/nqchart-docs/` |
| External app integration | `skills/consumer/nqchart/` (not for this repo) |
