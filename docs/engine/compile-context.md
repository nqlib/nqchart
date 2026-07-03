# Compile context

## Flow

```
NQ*Chart (root)
  → PartRegistryProvider (children register parts)
  → useCompiledOption(compileFn, rootFields)
  → CompileContext { data, chartConfig, parts, layout, … }
  → compile-bar.ts | compile-line.ts | … (pure fn)
  → EChartsOption
  → EChartsHost
```

## Key files

| File | Role |
|------|------|
| `echarts-core/use-compiled-option.ts` | Builds context, memoizes option |
| `echarts-core/parts/types.ts` | `CompileContext`, part types |
| `echarts-core/compile-*.ts` | Per-chart pure compilers (~17) |
| `echarts-core/create-cartesian-chart.tsx` | Shared boilerplate for cartesian charts |
| `echarts-core/resolve-chart-colors.ts` | Theme-aware color resolution |
| `echarts-core/validate-data-keys.ts` | Dev-mode dataKey warnings |

## Rules for compilers

- **Server-safe pure functions** — never touch `document` or hooks.
- Null-render compound components (`<Grid />`, `<XAxis />`) register parts and render nothing.
- `row[bar.dataKey] ?? 0` silently zero-fills; dev validation warns on typos.

## Deferred refactor

Narrowed per-chart context types (`CartesianCompileContext` vs `RadialCompileContext`) so `tsc` rejects cross-domain field reads. See [[product/roadmap]].
