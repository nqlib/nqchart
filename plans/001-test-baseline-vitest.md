# Plan 001 — Establish a test baseline (Vitest) for the chart engine and LLM pipeline

- **Status:** TODO
- **Written against commit:** `f43ccf9` (branch `landing-redesign-and-theme`)
- **Effort:** M · **Risk of change:** low · **Priority:** 1 (other plans' refactors depend on this safety net)

## Why this matters

This repo (a Next.js app named `beecharts` — a shadcn-style chart registry built on Apache ECharts, plus a fumadocs docs site) has **zero automated tests**. CI (`.github/workflows/ci.yml`) runs only `pnpm audit`, `eslint`, `tsc --noEmit`, and `pnpm build`. The highest-value logic in the repo is purely functional and currently unprotected:

1. **Chart option compilers** in `src/registry/echarts-core/compile-*.ts` (~17 files). Each is a pure function `(ctx: CompileContext) => EChartsOption`. A regression here silently changes every user's rendered charts.
2. **MDX→Markdown processing** in `src/lib/llm.ts` — 14+ chained regexes that power the `/llm/*.md` routes, `/llms.txt`, and the `/mcp` doc-search endpoint. One broken regex corrupts all agent-facing docs.

This plan adds Vitest, a first wave of unit/snapshot tests for those two areas, and a CI test step. It deliberately does NOT test React components, ECharts rendering, or anything needing a DOM/canvas — that is a later phase.

## Environment / commands (verification gates used throughout)

- Package manager: **pnpm 10.12.1** (`packageManager` field in `package.json`). Never use npm/yarn/bun here.
- Existing gates: `pnpm lint` (eslint), `pnpm exec tsc --noEmit`, `pnpm build`.
- `pnpm install` triggers `postinstall: fumadocs-mdx` (generates `.source/`). `src/registry/__index__.tsx` and `registry.json` are committed, so a fresh clone typechecks without extra steps.

## Repo conventions to follow

- TypeScript strict mode is on (`tsconfig.json` has `"strict": true`). Path alias `@/*` → `src/*`.
- Files are kebab-case (`compile-pie.ts`, `lazy-mount.tsx`). Named exports, no default exports in the engine.
- Engine code has zero `any` casts — keep it that way in test helpers (use the real types from `src/registry/echarts-core/parts/types.ts`).

## Current state (verified excerpts)

`src/registry/echarts-core/compile-pie.ts` (entire file is 47 lines — the smallest compiler, use it as your first target):

```ts
export function compilePieOption(ctx: CompileContext): EChartsOption {
  const pies = ctx.parts.filter((p): p is PieSeriesPart => p.type === "pie");
  const pie = pies[0];
  const nameKey = pie?.nameKey ?? ctx.nameKey ?? Object.keys(ctx.data[0] ?? {})[0];
  const valueKey = pie?.dataKey ?? "value";

  const pieData = ctx.data.map((row) => {
    const seriesKey = String(row[nameKey] ?? "");
    return {
      name: ctx.config[seriesKey]?.label?.toString() ?? seriesKey,
      value: Number(row[valueKey] ?? row[seriesKey] ?? 0),
      itemStyle: { color: ctx.resolveColor(seriesKey, 0) },
    };
  });
  // ... builds EChartsOption, then:
  return applyChartUiToOption(ctx, base);
}
```

Key facts you must know before writing tests:

- `CompileContext` is defined in `src/registry/echarts-core/parts/types.ts` (~20+ optional fields). Read it first and build a `makeCtx()` helper with only the required fields plus sensible defaults.
- `ctx.resolveColor` is a function the context carries; in tests, stub it as `(key, i) => \`color(${key},${i})\`` so snapshots are deterministic and readable.
- `resolveCanvasChartChrome(chartId)` (in `src/registry/echarts-core/resolve-chart-chrome.ts`) guards on `typeof document === "undefined"` and returns a default chrome object — so compilers run fine in a **node** test environment, no jsdom needed.
- Compilers must never touch the DOM. If a compiler you test DOES throw on missing `document`, that's a finding — see Escape hatches.

`src/lib/llm.ts` — the function to test is `processMdxForLLMs` (exported) and its helpers (`stripMdxComponentTags`, `parseCommands`, `getAttribute`, `renderPackageCommands` — check which are exported; test through `processMdxForLLMs` if they're private). Example of the regex chains (verified at lines 109–147):

```ts
function stripMdxComponentTags(content: string) {
  return content
    .replace(/<CodeTabs(?:\s[^>]*)?>/g, "")
    .replace(/<TabsList(?:\s[^>]*)?>[\s\S]*?<\/TabsList>/g, "")
    .replace(/<StepTitle(?:\s[^>]*)?>([\s\S]*?)<\/StepTitle>/g, "### $1")
    // ... ~14 more patterns, incl. ApiRow attr parsing and <Link> → markdown links
}
```

Note: `src/lib/llm.ts` imports `Index` from `@/registry/__index__` and renders ComponentPreview/ComponentSource references — check its imports before testing; if `processMdxForLLMs` pulls in React or fumadocs `source` at module load, test the pure helpers via a thin extraction (see Step 5 escape hatch).

## Steps

### Step 1 — Add Vitest

Add devDependencies (pnpm): `vitest`, `vite-tsconfig-paths`.

```bash
pnpm add -D vitest vite-tsconfig-paths
```

Create `vitest.config.ts` at repo root:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

Add to `package.json` scripts: `"test": "vitest run"` and `"test:watch": "vitest"`.

**Verify:** `pnpm exec vitest run --passWithNoTests` exits 0.

### Step 2 — Test helper for compiler contexts

Create `src/registry/echarts-core/__tests__/make-ctx.ts`. Read `src/registry/echarts-core/parts/types.ts` and build:

```ts
import type { CompileContext } from "../parts/types";

export function makeCtx(overrides: Partial<CompileContext> = {}): CompileContext {
  return {
    chartId: "test-chart",
    config: {},
    data: [],
    parts: [],
    resolveColor: (key: string, i: number) => `color(${key},${i})`,
    // ...fill remaining REQUIRED fields per the actual type; prefer the
    // narrowest valid defaults. Do not invent fields not in the type.
    ...overrides,
  };
}
```

If `CompileContext` requires fields you can't infer defaults for, look at how `useCompiledOption` (`src/registry/echarts-core/use-compiled-option.ts`) constructs the context and copy its defaults.

**Verify:** `pnpm exec tsc --noEmit` passes (helper compiles against real types).

### Step 3 — Compiler tests (pie first, then bar, then 2 more)

Create `src/registry/echarts-core/__tests__/compile-pie.test.ts`:

- Case 1: empty data → returns an option object with `series` array, doesn't throw.
- Case 2: 3-row dataset with a `PieSeriesPart` in `parts` (build the part literal per the `PieSeriesPart` type) → assert `series[0].data` names/values/colors map correctly (explicit assertions, not just snapshot).
- Case 3: config label override (`config: { alpha: { label: "Alpha Co" } }`) → `name` uses the label.
- Case 4: inline snapshot of the full option for one representative ctx (`expect(option).toMatchSnapshot()`), to lock the whole shape.

Then `compile-bar.test.ts` for `src/registry/echarts-core/compile-bar.ts` (the most complex compiler — stacking, layout, radius roles). Read the file first; cover at minimum: vertical vs horizontal layout, stacked vs unstacked, missing `dataKey` (currently coerces to 0 — pin that behavior with a test and a comment that it's known-questionable). Then pick two more compilers (suggest `compile-line.ts`, `compile-waterfall.ts`) with one happy-path snapshot + one edge case each.

**Verify after each file:** `pnpm test` green; snapshots committed.

### Step 4 — llm.ts tests

Create `src/lib/__tests__/llm.test.ts` with fixture strings (inline template literals, no fixture files needed):

- `<StepTitle>Install</StepTitle>` → `### Install`
- `<ApiRow name="dataKey" type="string" required>The key.</ApiRow>` → heading + `type: \`string\`` + `(required)`
- `<Link href="/docs/bar">Bar docs</Link>` → `[Bar docs](/docs/bar)`
- A nested Tabs block → TabsList content removed, TabsPanel content kept.
- Plain markdown without any MDX tags → passes through byte-identical.

**Verify:** `pnpm test` green.

### Step 5 — Wire into CI

Edit `.github/workflows/ci.yml`: add after the Typecheck step, before Build:

```yaml
      - name: Test
        run: pnpm test

      - name: Audit doc previews
        run: pnpm run audit:previews
```

(`audit:previews` runs `node src/scripts/audit-doc-previews.mjs`, which validates that every `ComponentPreview name=` in the docs exists in the registry index — it exists today but is not run in CI, so registry/docs drift is invisible. It needs `src/registry/__index__.tsx`, which is committed, so it can run before Build.)

**Verify:** `act` is not required — just confirm the YAML parses (`pnpm exec tsx -e ""` is unrelated; use any YAML check or careful review) and that both commands pass locally.

## Done criteria (machine-checkable)

1. `pnpm test` exits 0 with ≥ 12 passing tests across ≥ 5 test files.
2. `pnpm exec tsc --noEmit` exits 0.
3. `pnpm lint` exits 0.
4. `pnpm build` exits 0 (test deps must not break the Next build).
5. `.github/workflows/ci.yml` contains `pnpm test` and `pnpm run audit:previews` steps.
6. No file outside the allowed scope (below) is modified.

## Scope boundaries

- **In scope:** `vitest.config.ts` (new), `package.json` (scripts + devDeps only), `pnpm-lock.yaml` (regenerated by pnpm), new `__tests__` directories/files under `src/registry/echarts-core/` and `src/lib/`, `.github/workflows/ci.yml`.
- **Out of scope — do not touch:** any existing source file in `src/registry/echarts-core/` (you are testing current behavior, not fixing it), `src/lib/llm.ts` itself, `next.config.ts`, `tsconfig.json`, eslint config, any component. If a test reveals a bug, write the test to PIN the current behavior with a `// KNOWN-ISSUE:` comment and report it — do not fix.

## Escape hatches — STOP and report instead of improvising if:

- A compiler imports something that touches `document`/`window` at module load (not behind a guard) and tests can't run in node env. Report which import; do not switch the whole suite to jsdom on your own.
- `processMdxForLLMs` cannot be imported in node without pulling in React/fumadocs runtime. In that case test only the pure regex helpers if exported; if they're not exported, STOP and report — do not refactor `llm.ts` exports yourself.
- `CompileContext` requires a field whose default you cannot determine from `use-compiled-option.ts`. Report the field name.
- Adding vitest causes a peer-dependency conflict with the pinned Next/React versions. Report the conflict verbatim.

## Maintenance note

Every future compiler change should update these snapshots deliberately (`vitest -u` after reviewing the diff). When Plan(s) refactoring the engine (chart factory, CompileContext narrowing) land, these tests are the regression net — they must pass unchanged, since those refactors promise behavior preservation.
