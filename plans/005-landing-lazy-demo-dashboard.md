# Plan 005 — Defer the landing page's 4-chart demo dashboard out of first-load JS

- **Status:** TODO
- **Written against commit:** `f43ccf9` (branch `landing-redesign-and-theme`)
- **Effort:** S–M · **Risk of change:** medium (layout shift / hydration) · **Priority:** 5

## Why this matters

The landing page (`src/app/page.tsx`) statically imports `DemoDashboard` (verified at line 8):

```tsx
import { DemoDashboard } from "@/components/landing/demo-dashboard";
```

`src/components/landing/demo-dashboard.tsx` (257 lines, `"use client"`) renders **four live ECharts charts** (Area, Composed, Pie, Radial). Because the import is static, the ECharts engine (`echarts/core` + registered chart modules), the chart engine from `src/registry/`, and all four chart components are part of the landing page's first-load client bundle and hydrate immediately — even though the dashboard sits **below the fold** (it's the third section, after the hero and the stats strip; `page.tsx:72-75`):

```tsx
        {/* Live dashboard demo */}
        <section className="pt-20">
          <DemoDashboard />
        </section>
```

The docs pages already solved this exact problem with an IntersectionObserver wrapper — `src/components/docs/charts/lazy-mount.tsx` (`LazyMount`), whose doc comment says it exists "to avoid mounting many heavy chart components (ECharts + ResizeObserver) on the same page at once". The landing page should use the same mechanism plus a dynamic import so the chart code isn't even downloaded until needed.

## Existing exemplar to reuse (read it before coding)

`src/components/docs/charts/lazy-mount.tsx` — key properties you must preserve when reusing it:

- Client component; starts not-visible on server AND client (hydration-safe).
- `IntersectionObserver` with `rootMargin` default `"300px 0px"`; falls back to immediate mount when IO is unavailable.
- Renders `{isVisible ? <React.Suspense fallback={fallback}>{children}</React.Suspense> : fallback}` inside a `div` with `className={cn("size-full", className)}`.

It lives under `src/components/docs/` but has no docs-specific logic — importing it from a landing component is acceptable in this codebase (single app, shared `@/` alias). Do NOT copy-paste a second implementation.

## Approach

Two stacked changes:

1. **Code-split:** convert the `DemoDashboard` import to `next/dynamic` with `ssr: false` inside a small client wrapper, so the 4-chart bundle becomes a separate async chunk.
2. **Defer mount:** wrap it in `LazyMount` so the chunk is only requested when the user approaches the section.

And one guard against layout shift:

3. **Reserved space + skeleton fallback:** the fallback must approximate the dashboard's rendered height so scrolling doesn't jump when charts pop in.

## Steps

### Step 1 — Measure the rendered dashboard height

Run `pnpm dev`, open `http://localhost:3000`, measure the `DemoDashboard` section's height at ~1280px and at ~390px viewport widths (browser devtools; the section is the third block on the page). Record both numbers — they parameterize the skeleton. (If you cannot run a browser in your environment, read `demo-dashboard.tsx` and derive an approximate min-height from its grid: it renders KPI cards plus chart cards with fixed chart heights — find the explicit `h-*` / height values in the file and sum per breakpoint. State in your report which method you used.)

### Step 2 — Create a deferred wrapper

New file `src/components/landing/demo-dashboard-lazy.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";

import { LazyMount } from "@/components/docs/charts/lazy-mount";
import { Skeleton } from "@/components/ui/skeleton";

const DemoDashboard = dynamic(
  () => import("./demo-dashboard").then((m) => m.DemoDashboard),
  { ssr: false, loading: () => <DemoDashboardSkeleton /> },
);

function DemoDashboardSkeleton() {
  return (
    <div className="min-h-[<measured-mobile-height>px] sm:min-h-[<measured-desktop-height>px] ...">
      {/* a few <Skeleton /> blocks roughly matching the KPI row + 2x2 chart grid */}
    </div>
  );
}

export function DemoDashboardLazy() {
  return (
    <LazyMount rootMargin="600px 0px" fallback={<DemoDashboardSkeleton />}>
      <DemoDashboard />
    </LazyMount>
  );
}
```

Notes:
- Confirm `src/components/ui/skeleton.tsx` exists (it does at plan-writing time) and check how other components use it for the exact import/props.
- `rootMargin="600px 0px"` (more generous than the docs' 300px) because the dashboard is the first thing below the fold — it should usually be mounted by the time it's visible.
- Match the skeleton's outer structure (container classes, gaps) to `demo-dashboard.tsx`'s top-level wrapper so widths align. Replace the `min-h` placeholders with Step 1's measurements.
- Follow file conventions: kebab-case filename, named export, double quotes.

### Step 3 — Swap the usage in page.tsx

In `src/app/page.tsx`: replace the import at line 8 with `import { DemoDashboardLazy } from "@/components/landing/demo-dashboard-lazy";` and the usage at line 74 with `<DemoDashboardLazy />`. **Change nothing else in the file** — it's a server component with `force-static` + `revalidate` exports that must stay.

### Step 4 — Verify behavior and bundle effect

1. `pnpm build` — note the route table output for `/`: the First Load JS for `/` must DROP versus a baseline build from the unmodified tree (run `pnpm build` once before your change and record the number — this is your before/after evidence).
2. `pnpm dev`, load `/` with devtools Network panel: the demo-dashboard chunk must NOT load at initial paint with the viewport at the top; it must load as you scroll toward the section, and charts render normally.
3. Hard-reload while already scrolled to the dashboard (browser restores scroll) — charts must still appear (IO fires immediately for in-view elements).
4. Check for layout shift: scroll down slowly; the page must not jump when the dashboard mounts (skeleton height ≈ real height within ~10%).
5. Toggle dark mode after charts are visible — chart colors must update (theme observer behavior unchanged).

## Done criteria (machine-checkable where possible)

1. `rg -n "from \"@/components/landing/demo-dashboard\"" src/app/page.tsx` returns nothing (only the lazy wrapper is imported).
2. `pnpm build` succeeds; reported First Load JS for route `/` is lower than the pre-change baseline (record both numbers in your report).
3. `pnpm lint && pnpm exec tsc --noEmit` exit 0.
4. Manual checks 2–5 from Step 4 pass (describe each result in your report).

## Scope boundaries

- **In scope:** new `src/components/landing/demo-dashboard-lazy.tsx`, two-line change in `src/app/page.tsx`.
- **Out of scope — do not touch:** `demo-dashboard.tsx` itself (its internal memoization issues are a separate concern), `lazy-mount.tsx` (reuse as-is; if it needs changes, see escape hatches), any chart engine file, `ChartGallery`/`FeatureCode` sections (they're SVG-based and cheap), the `dynamic`/`revalidate` route exports.

## Escape hatches — STOP and report if:

- `dynamic(..., { ssr: false })` is rejected because the wrapper ends up evaluated in a server context (Next 16 disallows `ssr: false` in Server Components) — the wrapper file MUST have `"use client"` at top; if the error persists anyway, report the exact build error.
- First Load JS for `/` does NOT drop after the change — that means something else on the landing page also imports the chart engine eagerly (check `chart-gallery.tsx`, `feature-code.tsx`, `landing-header.tsx` imports with `rg "registry/charts|echarts" src/components/landing/`). Report what you find; do not chase it beyond reporting.
- `LazyMount` turns out to have a docs-only dependency you can't import cleanly — report it; only then consider moving the file to `src/components/lazy-mount.tsx` (move + update all importers, no copy).

## Test plan

No unit tests (behavior is browser-dependent). The build-size before/after numbers in the report are the regression evidence. If Plan 001's Vitest exists, no test is still fine — note it.

## Maintenance note

Anyone adding new heavy sections to the landing page should follow this same pattern (dynamic + LazyMount + height-matched skeleton). If the dashboard's layout changes materially, the skeleton's `min-h` values must be re-measured or the layout-shift guard erodes.
