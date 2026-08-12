# NQChart — documentation index

Everything in `docs/` is reachable from this page. Docs live with the code; a PR that changes
behavior updates its docs in the same PR (see [`conventions.md`](conventions.md)).

| Section | What's in it | Start at |
|---|---|---|
| [`product/`](product/) | Product layer: philosophy, specs, epics & stories (the *what/why*), agentic workflow, DoD | [`product/README.md`](product/README.md) · [`product/philosophy.md`](product/philosophy.md) |
| [`architecture/`](architecture/) | System design, layer model (compound · compile · host), dependency rules, public surface | [`architecture/system.md`](architecture/system.md) · [`architecture/layers.md`](architecture/layers.md) |
| [`engine/`](engine/) | Compile pipeline, chart-recipes | [`engine/compile-context.md`](engine/compile-context.md) |
| [`registry/`](registry/) | Chart catalog, registry build | [`registry/chart-catalog.md`](registry/chart-catalog.md) |
| [`meta/`](meta/) | Publishing, agent HTTP / MCP | [`meta/publishing.md`](meta/publishing.md) |
| [`../plans/`](../plans/) | Technical implementation blueprints (the *how*); numbered `NNN-*.md` | [`../plans/README.md`](../plans/README.md) |

**Public API reference** (what consumers read) lives in **`src/content/docs/`** — Fumadocs at `/docs`. This vault is for **maintainers**.

## How the layers fit together

```
product/           why & what: philosophy → specs → epics → stories
  └─ plans/        how: phased technical blueprints, linked from stories
       └─ architecture/   the agreed shape: system + layers + public surface
            └─ code       src/registry/, src/content/docs/, skills/
```

- **Product work** starts as an epic + stories in `product/epics/` (see the
  [guideline](product/agentic-coding-guideline.md)); a story links a `plans/NNN-*.md`
  blueprint when it needs one.
- **Features do not land from chat alone** — story (optional for small work) + plan
  (required for features) + code in the same PR when the design changes.
- **Completed plans** keep their files with `Status: DONE`; the epic/story status is the
  capability record humans and agents scan first.

## Related roots (not under `docs/`)

| Path | Role |
|------|------|
| `AGENTS.md` / `CLAUDE.md` | Agent router |
| `memory/` | Durable non-code decisions (write rarely) |
| `.agents/skills/fixed/` | Bug / regression search index |
| `skills/consumer/nqchart/` | Consumer agent skill (SOT → `pnpm sync:skills`) |
| `src/content/docs/` | Public MDX reference |
