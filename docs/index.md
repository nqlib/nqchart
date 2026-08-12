# NQChart — documentation vault

Internal architecture and product notes for **maintainers**. Open in Obsidian (or any editor).

**Start at the index:** [`README.md`](README.md) (SecoLab-style map of the whole vault).

Public API reference lives in **`src/content/docs/`** (Fumadocs at `/docs`).

## Start here

| Topic | Note |
|--------|------|
| Vault index | [`README.md`](README.md) |
| Philosophy | [[product/philosophy]] |
| Public API specs | [[product/specs]] |
| Epics & stories | [[product/README]] |
| System architecture | [[architecture/system]] |
| Layer model (CCH) | [[architecture/layers]] |
| Import rules | [[architecture/dependency-rules]] |
| Public surface contract | [[architecture/public-surface]] |
| Chart catalog | [[registry/chart-catalog]] |
| Compile pipeline | [[engine/compile-context]] |
| Change design (plans) | `plans/README.md` |
| Agent intake | [[product/agentic-coding-guideline]] |
| DoD | [[product/ai-contract]] |
| Shared memory | `memory/INDEX.md` |
| Past bug fixes | `.agents/skills/fixed/index.md` |

## Layers (code)

- `src/registry/echarts-core/` — compile · host
- `src/registry/charts/` — compound roots
- `src/registry/ui/` — shipped shell UI
- `src/components/` — **site-only**; never imported by registry

## Related

- **Public docs site** — `src/content/docs/`
- **Executor plans** — `plans/README.md` (the *how*; epics/stories are the *what/why*)
- **Repo agent router** — root `AGENTS.md` · `CLAUDE.md`
