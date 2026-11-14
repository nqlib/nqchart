---
name: nqchart-fixed-domain-performance
description: >-
  Performance on dashboards with many charts — slow load, theme switch freezes,
  forced style recalcs, idle CPU. Read before touching color/chrome resolution
  or per-chart observers.
skill: nqchart-fixed
kind: domain
domain: performance
tags: performance, dashboard, style recalc, getComputedStyle, layout thrash, theme switch, lag
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: performance

Costs that scale with the number of charts on a page.

## Measure first

- `/perf-check` renders the BI mix (`?copies=N` multiplies, `?set=all`, `?only=a,b`).
- Probe with Playwright + CDP `Performance.getMetrics`: watch `RecalcStyleCount` / `RecalcStyleDuration`
  per phase (load, theme toggle, resize) and long tasks. A count that grows with chart count × colors is
  a thrash.

## Rules

| Rule | Why |
|------|-----|
| Never insert/remove DOM nodes to resolve a color per call | Each insert dirties styles; the next `getComputedStyle` forces a full-document recalc — quadratic on dashboards |
| Read CSS custom properties without mutating the DOM in between | Reads are cheap only while styles stay clean |
| Cache pure conversions (literal color → computed color) | They never change for the same input |

## Fixes

- [color probe style thrash](../fixes/performance-color-probe-style-thrash.md)
