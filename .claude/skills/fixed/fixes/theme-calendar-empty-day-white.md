---
name: nqchart-fixed-theme-calendar-empty-day-white
description: >-
  Fixed: calendar days with no value painted solid white in dark mode, and the
  month outline was black. ECharts defaults; the compiler and chrome layer now
  set both.
skill: nqchart-fixed
kind: fix
domain: theme
status: fixed
fixed: "2026-11"
tags: calendar, dark mode, white cells, empty day, splitLine, itemStyle, ECharts default
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fix: calendar empty days white in dark mode

**Domain:** [theme](../domains/theme.md)
**Status:** fixed (2026-11)
**Verify:** `/docs/calendar-chart/static` → Workload dashboard → "Employee month".
Toggle dark mode. Saturday and Sunday show the canvas, not white blocks. The month
outline is the soft split-line grey, not black. `pnpm test` — `compile-grid-cells`.

## Symptoms

- Dark mode: days with no value (weekends, days outside the data) are solid white.
- Both themes: a hard black outline around the month.

## Root cause

ECharts `calendar.itemStyle.color` defaults to `#fff` and `calendar.splitLine.lineStyle.color`
defaults to `#000`. `compile-calendar` set only the empty-day border, and
`themeCalendar` themed only the labels.

## Fix (do not revert)

| File | Change |
|------|--------|
| `echarts-core/compile-calendar.ts` | `calendar.itemStyle.color: "transparent"` |
| `echarts-core/apply-chart-chrome.ts` | `themeCalendar` sets `splitLine.lineStyle.color` to `chrome.splitLine`; an authored colour wins |

Do not give empty days a fill with no border. The seam rule paints the gap only on
the series, so a filled backdrop shows as one solid block with no seams.
