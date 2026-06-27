# Plan 006 — Landing/docs accessibility quick wins (h1, reduced motion, SVG labels, button contrast)

- **Status:** TODO
- **Written against commit:** `f43ccf9` (branch `landing-redesign-and-theme`)
- **Effort:** S–M · **Risk of change:** low · **Priority:** 6

## Why this matters

Four verified accessibility gaps in the `beecharts` site (Next.js app: landing page + fumadocs docs). None require design changes; all are mechanical.

1. **No `<h1>` on the landing page.** `src/app/page.tsx:36-50` renders the hero as Badge → `<BeeChartWordmark>` (an SVG wordmark component) → `<p>`; the first heading on the page is the final CTA's `<h2>` at line 89. Screen-reader outline and SEO both expect exactly one h1.
2. **No `prefers-reduced-motion` handling in the UI layer.** The chart engine already respects it (`src/registry/echarts-core/chart-animation-tokens.ts:133-136` has a `prefersReducedMotion()` helper used by `apply-chart-animation.ts`, `apply-rollout-intro.ts`, `use-monospace-collapse.ts`) — but the **CSS layer** (`src/app/globals.css`, 421 lines, no `@media (prefers-reduced-motion)` rule anywhere) and the **motion/react springs** (`src/components/docs/mdx/components/toc-indicator.tsx`, `src/components/docs/sidebar/nav-main.tsx`, `src/registry/ui/loading-shimmer.tsx`) animate unconditionally. WCAG 2.3.3.
3. **Logo SVGs lack accessible names.** `BeeChartWordmark` (imported from `@/assets/logos/beechart`) is rendered in `src/app/page.tsx:41-45` and in `src/components/landing/landing-header.tsx` with no `aria-label`/`role` — as the de-facto page title and header logo link content, it's announced as nothing.
4. **Dark-mode button contrast.** `src/components/ui/enhanced-button.tsx:35,44,53` — the `default`, `destructive`, and `secondary` variants all include `"opacity-90 hover:opacity-100"`. At 90% opacity over the dark background, primary-button label contrast risks falling below WCAG AA 4.5:1, and the default↔hover distinction is weak for low-vision users.

## Verification commands

`pnpm lint` · `pnpm exec tsc --noEmit` · `pnpm build` · manual checks via `pnpm dev` (listed per step). Package manager: pnpm 10.12.1.

## Repo conventions

Tailwind v4 utility classes; tokens defined in `src/app/globals.css` via `@theme` + `:root`/`.dark` oklch values; components use `cva` for variants (see `enhanced-button.tsx`), kebab-case filenames, double quotes.

## Steps

### Step 1 — Landing h1

In `src/app/page.tsx`, inside the hero `<section>` (line 37), add as first child:

```tsx
<h1 className="sr-only">BeeCharts — composable React charts for shadcn/ui dashboards</h1>
```

Check `src/globals/constants/site.ts` for `SITE_NAME`/`SITE_DESCRIPTION` (already imported in this file at line 13) — prefer composing the h1 text from those constants over a hardcoded string if they read naturally.

**Verify:** view-source on `pnpm dev` homepage shows exactly one `<h1>`; heading order afterward is h1 → h2s (the section headings). Run `rg -c "<h1" src/app/page.tsx` → 1.

### Step 2 — Global reduced-motion CSS guard

In `src/app/globals.css`, append at the end of the file:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This neutralizes all CSS/Tailwind transitions and keyframe animations (incl. Radix open/close animations and `tw-animate-css` utilities) in one place.

### Step 3 — Reduced motion for motion/react springs

The repo uses the `motion` package (motion/react). It exports a `useReducedMotion()` hook. Apply in three files:

- `src/components/docs/mdx/components/toc-indicator.tsx` — the spring-animated TOC follower. Read the file; where the `motion.*` element receives its spring `transition`, gate it: `const reduceMotion = useReducedMotion();` then `transition={reduceMotion ? { duration: 0 } : <existing spring>}`. The indicator must still MOVE to the right position (jump instantly), not freeze.
- `src/components/docs/sidebar/nav-main.tsx` — same treatment for the tree indicator spring (around line 76, `transition={{ type: "spring", stiffness: 200 - activeIndex * 10, damping: 20 }}`).
- `src/registry/ui/loading-shimmer.tsx` — the infinite shimmer sweep (line 49: `transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}`). With reduced motion, render the static skeleton block without the sweeping gradient animation (conditional render or `transition={{ duration: 0 }}` + no repeat — pick whichever keeps the skeleton visible and static).

Note `loading-shimmer.tsx` is in `src/registry/` (shipped to users via the registry). Keep the change self-contained in that file (no new imports from `src/components/`) so the registry payload stays standalone. `motion/react`'s `useReducedMotion` import is fine — the file already depends on motion.

**Verify:** macOS System Settings → Accessibility → Display → Reduce Motion ON, then on `pnpm dev`: docs page TOC indicator jumps without springing; sidebar indicator likewise; chart loading skeletons show no sweep. Reduce Motion OFF restores all three.

### Step 4 — SVG accessible names

- Open `src/assets/logos/beechart` (resolve the actual file; also find the mark/logomark component if separate — check `src/components/landing/landing-header.tsx` imports). If the component spreads props onto `<svg>`, add `role="img"` and `aria-label="BeeCharts"` at the call sites that convey identity: the hero usage in `page.tsx` and the header logo. If the header logo is wrapped in a `<Link href="/">`, the link needs the accessible name (`aria-label="BeeCharts home"` on the Link) and the SVG should get `aria-hidden="true"` instead — inspect the actual markup and apply the correct one of these two patterns.
- `src/components/landing/chart-gallery.tsx` renders decorative SVG previews (from `src/components/docs/svg-previews/`) inside cards that already have visible text labels — add `aria-hidden="true"` to the preview wrapper so they're skipped.

**Verify:** VoiceOver (or browser accessibility tree in devtools) announces the header logo link as "BeeCharts home" (or equivalent) and does not announce the gallery preview SVGs.

### Step 5 — Dark-mode button opacity

In `src/components/ui/enhanced-button.tsx`, in each of the three variants containing `"opacity-90 hover:opacity-100"` (lines 35, 44, 53), replace that string with:

```
"opacity-90 hover:opacity-100 dark:opacity-100 dark:hover:brightness-110"
```

(Keeps the light-mode treatment, removes the translucency in dark mode, gives dark hover a brightness cue instead.)

Then measure: with `pnpm dev` in dark mode, use devtools to sample the rendered primary button background and label colors, and check contrast (devtools' built-in contrast checker on the computed colors, or paste into a WCAG calculator). Required: ≥ 4.5:1 for the label in default state. If light mode's `opacity-90` also fails the check, report it (don't redesign light mode in this plan).

**Verify:** visual spot-check both themes — gradients/shadows (`nqui-button-gradient`, `nqui-button-shadow` classes) still render; hover state visibly changes in dark mode.

## Done criteria (machine-checkable where possible)

1. `rg -c "<h1" src/app/page.tsx` → 1; `pnpm build` output page renders it (check `.next` output or view-source).
2. `rg -c "prefers-reduced-motion" src/app/globals.css` ≥ 1.
3. `rg -l "useReducedMotion" src/components/docs/mdx/components/toc-indicator.tsx src/components/docs/sidebar/nav-main.tsx src/registry/ui/loading-shimmer.tsx` lists all three files.
4. `rg -n "opacity-90 hover:opacity-100\"" src/components/ui/enhanced-button.tsx` → no hits without the `dark:` additions on the same string.
5. `pnpm lint && pnpm exec tsc --noEmit && pnpm build` exit 0.
6. Manual checks from Steps 3–5 described in the executor report (Reduce Motion behavior, screen-reader names, contrast number measured).

## Scope boundaries

- **In scope:** `src/app/page.tsx` (h1 only), `src/app/globals.css` (appended media query only), `toc-indicator.tsx`, `nav-main.tsx`, `loading-shimmer.tsx` (reduced-motion gating only), `enhanced-button.tsx` (the three opacity strings only), logo/wordmark call sites + `chart-gallery.tsx` (aria attributes only).
- **Out of scope — do not touch:** the chart engine's animation system (`chart-animation-tokens.ts` and `apply-*` files — already compliant), any color token in `globals.css`, spacing/landing layout, other `enhanced-button` variant styles, `lazy-mount.tsx`, anything in `src/content/`. Do not add an eslint a11y plugin in this plan.

## Escape hatches — STOP and report if:

- `motion`'s `useReducedMotion` is not exported by the installed version (check `node_modules/motion/package.json` version and the import that the three files already use) — report the version; do not hand-roll a matchMedia hook without flagging it.
- The wordmark component doesn't accept/spread extra props onto its `<svg>` — report; changing the asset component's signature affects other call sites and needs a decision.
- The global reduced-motion CSS visibly breaks a Radix component's open/close (e.g. a dialog that never becomes visible because it relies on animation end events) — report the component; a targeted exception is a design decision, not yours to make.

## Test plan

No unit tests (all behavior is browser/AT-dependent); the done criteria's rg checks + manual verification log are the evidence. If an axe scan tool is available (browser extension or `@axe-core/cli` against the dev server), run it on `/` before and after and include the delta in the report — optional, not required.

## Maintenance note

New interactive/animated components should follow the same two rules introduced here: every motion/react animation gates on `useReducedMotion()`, and any icon-only or SVG-only interactive element carries an accessible name. The global CSS guard covers plain CSS transitions automatically.
