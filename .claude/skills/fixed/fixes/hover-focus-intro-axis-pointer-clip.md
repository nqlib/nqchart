---
name: nqchart-fixed-hover-focus-intro-axis-pointer-clip
description: >-
  Fixed: hovering during area/line intro clips series mid-rollout and leaves a
  stuck dashed axisPointer. Silence zrender for introLock; clear tip + axis cursor
  on lock start/end and globalout.
skill: nqchart-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-07"
tags: intro, animation, axisPointer, area, line, stuck-hover, clip, silent
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: intro hover — clipped series + stuck axis cursor

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-07)  
**Verify:** stacked area with 4+ series — hover during the L→R intro; bands must finish drawing; after intro, dashed cursor must follow and clear on leave.

## Symptoms

- Hover **during enter animation** → later series **truncated** at the cursor x (looks “frozen”).
- Dashed **vertical axisPointer stuck**; tip may be missing; cursor no longer follows.
- More visible on multi-series **area** (stagger 160ms × series) than dual-series docs cards.
- Remount / hard refresh clears a clipped chart; hover alone does not.

## Root cause

1. Area/line intro uses staggered enter tweens (`apply-chart-animation.ts` + `CHART_ANIMATION.area`).
2. AxisPointer / emphasis mid-intro triggers an ECharts update that **cancels unfinished enter tweens**.
3. `introLock` already deferred `setOption` + soft-resized via `getZr().resize()`, but **mouse hit-testing stayed live**, so hover still interrupted the rollout.
4. After interrupt, ECharts often **does not clear** `axisPointer` on `globalout` without an explicit `updateAxisPointer` leave.

## Fix (do not revert)

| File | Change |
|------|--------|
| `src/registry/echarts-core/use-nq-echarts.ts` | During `introLock`: `getZr().silent = true` + `hideTip` / `updateAxisPointer` leave. On release: `silent = false`, clear hover chrome again, then `resize()`. Reuse clear helper on `globalout`. |

## Consumer / agent guidance

- **Do not** treat clipped bands + stuck dashed line as a CSS/`transform` hit-test bug first — check whether the user hovered **during intro**.
- Embeds in scrolling report shells still need a **non-scrolling chart island** (`overflow: hidden`, stable aspect) like `/charts` stages; that is separate from this intro race.
- Showcase may also use `pointer-events-none` until intro ms elapse as defense while on an older published `@nqlib/nqchart`.

## Wrong fixes (rejected)

- **Only `pointer-events-none` in the app** — does not fix the library for all consumers; keep as optional belt-and-suspenders.
- **Disabling all area animation in demos** — hides the race; does not fix engine.
- **Blaming `showBrush` / `aspect-video` alone** — can worsen hit-test, but the mid-intro clip is the silent/axisPointer race.
