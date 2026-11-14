---
name: nqchart-fixed-performance-color-probe-style-thrash
description: >-
  Fixed: dashboards with many charts loaded slowly and froze on theme switch.
  cssColorToCanvasRgb appended/removed a probe span per color, forcing a full
  style recalc each call. Shared hidden probe + cache.
skill: nqchart-fixed
kind: fix
domain: performance
status: fixed
fixed: "2026-11"
tags: performance, style recalc, getComputedStyle, probe, cssColorToCanvasRgb, theme switch, dashboard
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: color probe forced a style recalc per color

**Domain:** [performance](../domains/performance.md)  
**Status:** fixed (2026-11, plan 022)  
**Verify:** `/perf-check?copies=4` (96 cards, 140 ECharts) — Chromium load `RecalcStyleCount` ≈ 1.1k
(was 12.7k, 848 ms → 61 ms); theme toggle task 1.7 s → 0.66 s; WebKit theme toggle worst frame ~0.3 s
(was ~1 s, 8 fps).

## Symptoms

- Big BI dashboards lag on load and freeze for ~1 s on light/dark switch; worse as charts are added.
- CPU profile: `cssColorToCanvasRgb` ≈ 76% of load time.

## Root cause

`resolveCanvasChartChrome` converts 7 chrome tokens per call and is called from many compilers
(labels, seams, treemap, funnel…). `cssColorToCanvasRgb` appended a `<span>` to the chart, read
`getComputedStyle(probe).color`, then removed it. Every insert invalidated styles, so every read forced
a full-document recalc; calls scale with charts and each recalc scales with page size.

## Fix (do not revert)

`resolve-chart-chrome.ts`: literal colors resolve through **one** hidden probe (`data-nq-color-probe`,
`display: none`, on `body`) and a `Map` cache (cap 256). Only `var()` / `currentColor` / `inherit` still
use a probe inside the chart. Guard test: `__tests__/resolve-chart-chrome-perf.test.ts`.
