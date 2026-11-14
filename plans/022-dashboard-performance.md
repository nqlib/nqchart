# Plan 022 — Dashboard performance: many charts on one page

- **Status:** DONE 2026-11-07
- **Written:** 2026-11-07
- **Effort:** M · **Risk:** med (touches the shared ECharts hook and color resolution)
- **Skills:** `nqchart-dev`

## Why

Owner report (2026-11-07): the isometric bar block is laggy on hover, and a large BI dashboard
built from NQChart becomes "very very laggy". Unknown whether the host app or the library is at
fault. The 2026 audit lists "runtime behavior under load" as not audited.

## Scope — In

- `/perf-check` instrument page (dev, like `/bi-check`): renders every registry example in a
  grid, `?copies=N` to multiply, so a BI-sized page (40–150 charts) is one URL.
- Playwright + CDP measurement script (scratch, not shipped): load time, long tasks, idle CPU,
  hover and scroll frame times, theme-toggle cost, JS heap; CPU profile for top self-time.
- Fix library hot spots the profile shows (per-chart observers, forced style recalcs, idle
  loops, hover repaint cost) and the isometric block's per-frame SVG repaint.

## Scope — Out

- Host-app concerns (React re-render of the whole dashboard on unrelated state) — documented
  as guidance, not fixed here.

## Acceptance

- [x] Before/after numbers for the same page and machine, Chromium and WebKit
- [x] Isometric bar hover switches at band edges in both directions (Chromium + WebKit)
- [x] No per-chart cost that scales with page size (style recalcs per color)
- [x] Tests, tsc, eslint, check:size pass

## Results (dev server, `/perf-check?copies=4` = 96 cards / 140 ECharts, headless)

| Phase | Before | After |
|-------|--------|-------|
| Chromium load — forced style recalcs | 12,728 (848 ms) | 1,118 (61 ms) |
| Chromium load — long tasks | 6 / 921 ms | 2 / 288 ms |
| Chromium theme toggle ×2 — main-thread task | 1,683 ms (style 1,059 ms) | 658 ms (style 74 ms) |
| WebKit theme toggle — worst frame / fps | 1,014 ms / 8 fps | 271 ms / 46 fps |
| Hover sweep, scroll, idle | 60/120 fps, ~0 idle CPU | unchanged (already fine) |

- Root cause: `cssColorToCanvasRgb` inserted/removed a probe per color → full style recalc per call
  (76% of load CPU). Fix: shared hidden probe + cache. See
  `.agents/skills/fixed/fixes/performance-color-probe-style-thrash.md`.
- Isometric block: render cost was fine (120/60 fps); the "lag" was the hit target under the faces
  (leftward hover ~75 units late) and the intro stagger replaying on mouse-leave. Fixed.
- Tried and reverted: theme recompiles in `startTransition` — small gain in Chromium, none in WebKit,
  and charts could paint old colors on the new background for a frame.
- Remaining: a theme switch / resize repaints every canvas in one frame (~200–270 ms at 140 charts).
  That is ECharts painting; deferring offscreen charts would be the next step if needed.

## Host-side guidance (not library bugs)

- Keep chart props referentially stable (`data`, `config`, formatters) — a new array every parent render
  recompiles that chart.
- Don't lift hover / tooltip state into the dashboard root; it re-renders every chart.
