---
name: nqchart-fixed-hover-focus-isometric-hit-layer
description: >-
  Fixed: isometric (3D) bar block — moving the pointer left needed to travel
  almost a full band before the previous bar focused; bars returned to rest
  with the intro stagger. Hit layer on top, faces pointer-events none.
skill: nqchart-fixed
kind: fix
domain: hover-focus
status: fixed
fixed: "2026-11"
tags: isometric, 3d bar, hover, hit area, pointer-events, svg, lag, stagger
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: isometric bar — leftward hover lag

**Domain:** [hover-focus](../domains/hover-focus.md)  
**Status:** fixed (2026-11, plan 022)  
**Verify:** `/perf-check?only=isometric-bar-chart` — sweep left: the tooltip month changes at each band
edge (was ~75 viewBox units late, e.g. July → June at x≈444 instead of 519). Chromium + WebKit.

## Root cause

Each bar group drew a transparent band rect with `onMouseEnter`, then the bar faces **on top**. Moving
right enters the next band through its empty left gap (the rect) — instant. Moving left lands on the
previous bar's side face and front first, so the rect beneath never saw `mouseenter` until the pointer
reached the band's far-left gap. Separately, leaving the chart re-applied the intro stagger
(`index × 80 ms`) with the 350 ms duration, so bars settled one by one — it read as lag.

## Fix (do not revert)

`blocks/b-isometric-bar-chart.tsx`: bar faces `pointerEvents: "none"`; one full-height hit rect per band
drawn **last** (`onPointerEnter`); stagger only until the intro ends, then 150 ms with no delay.
