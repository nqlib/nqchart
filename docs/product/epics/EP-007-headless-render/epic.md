---
id: EP-007
title: Headless render
status: in-progress
target: 2026-Q4
owner: nqchart
---

# EP-007 — Headless render

## Goal

A consumer renders a chart in Node to an SVG string. The render uses the same compile path
as the browser. The consumer injects the theme. No browser and no DOM are necessary.

## Why now

- The consumer secolab exports dashboards to PDF (plan page 2370, SECO-1470).
- The export draws charts with matplotlib from rules that secolab copies from its desktop
  charts. The two outputs drift.
- The nqchart compilers are pure already. ECharts 5.3+ renders an SVG string in Node with
  `renderer: "svg"` and `ssr: true`. The missing parts are an export surface, a theme that
  the caller injects, and a legend that is not HTML.

## Scope — In

- ST-024: the compile path imports no React module, and a theme registry keyed by chart id
  feeds the helpers that read the DOM today.
- ST-025: the entry `@nqlib/nqchart/headless`, with `printLegend` and `renderToSvg`.
- ST-026: the release 0.4.0, with the changelog and the consumer skill.

## Scope — Out

- A headless browser.
- PNG rasterisation inside nqchart. The consumer rasterises the SVG.
- Optional peers (`peerDependenciesMeta`) for Node-only consumers. This is a follow-up story.
- The browser-side `renderToSVGString` export. This is a follow-up story.

## Stories

| ID | Title | Status | Plan |
|----|-------|--------|------|
| [ST-024](stories/ST-024-pure-compile-path-and-theme.md) | Pure compile path and the headless theme registry | done | [018](../../../../plans/018-headless-render.md) |
| [ST-025](stories/ST-025-headless-entry-and-svg-render.md) | Headless entry and the SVG render | done | [018](../../../../plans/018-headless-render.md) |
| [ST-026](stories/ST-026-release-0-4-0.md) | Release 0.4.0 | done | [018](../../../../plans/018-headless-render.md) |

## Success metrics

- A Node script renders a composed chart to SVG from `dist/headless.mjs` with no DOM.
- For the same context and the same theme, the headless option equals the browser option,
  except the tooltip, the animation and the HTML legend.
- secolab pins 0.4.0 and deletes its `@nqlib/nqchart` pnpm patch.

## Dependencies

- EP-004 (the compile path).
- Plan 016 (per-family ECharts registration).
