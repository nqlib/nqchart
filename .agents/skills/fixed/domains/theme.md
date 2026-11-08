---
name: nqchart-fixed-domain-theme
description: >-
  Domain: canvas colours that ignore the theme. An ECharts default colour
  (white fill, black line) that the compiler or the chrome layer never set
  shows up as a wrong block or line in dark mode.
skill: nqchart-fixed
kind: domain
domain: theme
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: theme

ECharts has fixed default colours for some components (calendar cells `#fff`, calendar
split lines `#000`). These defaults do not follow the theme. The chart must set them.

## Fixes

- [Calendar empty days white in dark mode](../fixes/theme-calendar-empty-day-white.md)

## When investigating

1. Toggle dark mode. Find the element that keeps a light-theme or ECharts default colour.
2. Find the option key in the ECharts docs and read its default colour.
3. Set chrome colours in `apply-chart-chrome.ts` from `resolveCanvasChartChrome`. Let an authored value win.
4. Set theme-independent values (`transparent`) in the compiler.
