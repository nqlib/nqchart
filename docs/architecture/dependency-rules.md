# Dependency rules

## Registry boundary (critical)

**`src/registry/**` must NOT import from `src/components/**`.**

Registry items ship as standalone files via `shadcn add @beecharts/*`. Site-internal shadcn primitives live in `src/components/ui/` and are not exported.

Verify:

```bash
pnpm run audit:registry-boundary
```

## Allowed registry dependencies

- `src/registry/**` (internal)
- Published npm peers: `echarts`, `react`, `motion`, etc.
- shadcn components the user already has (`@/components/ui/*` in consumer apps)

## Site vs product

| Path | Role |
|------|------|
| `src/components/ui/` | Docs site shadcn primitives only |
| `src/registry/ui/` | Chart shell shipped to users |
| `src/components/docs/` | MDX preview chrome, sidebar |
| `src/components/landing/` | Homepage demo (not registry) |

## Engine purity

- `compile-*.ts` files are **pure functions** — no hooks, no `document`, no React.
- Color/chrome DOM reads happen in hooks (`useCompiledOption`, `createColorResolver`) on the client only.

## Do not reintroduce

- Recharts imports (migration complete)
- Separate registry modules per BI synonym (`gauge-chart`, `histogram-chart`, …)
- Duplicate example `.tsx` for the same preview

See [[registry/chart-catalog]] for the canonical primitive list.
