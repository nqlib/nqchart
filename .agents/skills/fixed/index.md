---
name: nqchart-fixed-index
description: >-
  Domain and semantic search index for past NQChart fixes. Agents must search this
  file first when the user asks to fix a bug, flicker, hover dimming, or regression.
skill: nqchart-fixed
kind: index
metadata:
  author: nqchart
  version: "1.0.0"
---

# Fixed issues — search index

**Agents:** When the user asks to fix a bug, **search this file first** (domain table, then semantic table). Open the fix note before changing code.

Last updated: 2026-08-11

---

## Domain index

Problem areas → domain overview → individual fix notes.

| Domain | Symptoms (short) | Domain doc | Fix notes |
|--------|------------------|------------|-----------|
| **hover-focus** | Hover dims wrong mark; flicker; tile/point vanishes; stale bright siblings; `__highByOuter`; **intro clip + stuck axisPointer** | [domains/hover-focus.md](./domains/hover-focus.md) | [scatter symbol blur](./fixes/hover-focus-scatter-symbol-blur.md), [treemap flicker / vanish](./fixes/hover-focus-treemap-flicker-vanish.md), [funnel blur / flicker](./fixes/hover-focus-funnel-blur.md), [pie blur / flicker](./fixes/hover-focus-pie-blur.md), [waterfall blur / flicker](./fixes/hover-focus-waterfall-blur.md), [radial blur / flicker](./fixes/hover-focus-radial-blur.md), [intro axisPointer clip](./fixes/hover-focus-intro-axis-pointer-clip.md) |
| **labels** | Floating leader lines; truncated / missing rose names; labelLine stubs; radial ring names upside-down; polar clip; gauge tick pile-up; **vertical pipe funnel names clipped** | [domains/labels.md](./domains/labels.md) | [rose leader clip](./fixes/labels-rose-leader-clip.md), [radial ring orientation / clip](./fixes/labels-radial-ring-orientation-clip.md), [gauge axis overlap](./fixes/labels-gauge-axis-overlap.md), [funnel pipe vertical clip](./fixes/labels-funnel-pipe-vertical-clip.md) |
| **cartesian-stack** | Percent stack empty plot; series off-scale above yAxis.max 100; chrome paints, bands missing | [domains/cartesian-stack.md](./domains/cartesian-stack.md) | [area percent empty](./fixes/cartesian-stack-area-percent-empty.md) |
| **brush** | Footer slider splits bar groups; handle mid-cluster; range framing | [domains/brush.md](./domains/brush.md) | [band-edge handles](./fixes/brush-band-edge-handles.md) |
| **funnel-order** | Pipeline stages jump when values cross; hardcoded descending sort | [domains/funnel-order.md](./domains/funnel-order.md) | [sort none / sort prop](./fixes/funnel-order-sort-none.md) |
| **api-surface** | TS rejects a prop the runtime already wires; standalone props omit factory fields | [domains/api-surface.md](./domains/api-surface.md) | [standalone props drop inherited](./fixes/api-surface-standalone-props-drop-inherited.md) |

<!-- Add rows when new domains appear: animation, tooltip, compile-bar, registry-boundary, … -->

---

## Semantic index

Natural-language / trigger phrases → fix note. Scan this when the domain is obvious from chart type or file path.

| Triggers (any match) | Chart / area | Fix note |
|----------------------|--------------|----------|
| scatter hover dims hovered dot; mobile dot stays dim; all points blur; red dot opacity 0.2 when hovered | scatter | [hover-focus-scatter-symbol-blur](./fixes/hover-focus-scatter-symbol-blur.md) |
| scatter stale focus; previous dots stay bright; multiple dots emphasized | scatter | [hover-focus-scatter-symbol-blur](./fixes/hover-focus-scatter-symbol-blur.md) |
| treemap flicker on hover; layout sliding; animationDurationUpdate | treemap | [hover-focus-treemap-flicker-vanish](./fixes/hover-focus-treemap-flicker-vanish.md) |
| treemap hovered tile disappears; gap color on hover; tile vanishes | treemap | [hover-focus-treemap-flicker-vanish](./fixes/hover-focus-treemap-flicker-vanish.md) |
| treemap multiple tiles bright; blur not applied; normal:18 blur:0 | treemap | [hover-focus-treemap-flicker-vanish](./fixes/hover-focus-treemap-flicker-vanish.md) |
| funnel hover dims hovered stage; funnel flicker; stale bright stages | funnel | [hover-focus-funnel-blur](./fixes/hover-focus-funnel-blur.md) |
| funnel adjacent stage skip mouseout; funnel emphasis.disabled | funnel | [hover-focus-funnel-blur](./fixes/hover-focus-funnel-blur.md) |
| pie hover dims hovered slice; pie flicker; stale bright wedges | pie | [hover-focus-pie-blur](./fixes/hover-focus-pie-blur.md) |
| pie adjacent wedge skip mouseout; pie emphasis.disabled | pie | [hover-focus-pie-blur](./fixes/hover-focus-pie-blur.md) |
| waterfall hover dims hovered column; waterfall flicker; stale bright bars | waterfall | [hover-focus-waterfall-blur](./fixes/hover-focus-waterfall-blur.md) |
| waterfall stacked bar blur; __wf_values__ emphasis.disabled | waterfall | [hover-focus-waterfall-blur](./fixes/hover-focus-waterfall-blur.md) |
| radial hover dims hovered ring; rose petal flicker; stale bright rings | radial | [hover-focus-radial-blur](./fixes/hover-focus-radial-blur.md) |
| polar bar series focus gap flicker; radial emphasis.disabled | radial | [hover-focus-radial-blur](./fixes/hover-focus-radial-blur.md) |
| rose leader lines float; labelLine stubs; rose labels truncated S… …; names gone | rose / radial | [labels-rose-leader-clip](./fixes/labels-rose-leader-clip.md) |
| `__rose_labels__`; rose outerRadius 100% clips leaders | rose / radial | [labels-rose-leader-clip](./fixes/labels-rose-leader-clip.md) |
| radial ring names vertical; upside-down labels; stacked Chrome Safari Edge; semi clipped | concentric / radial | [labels-radial-ring-orientation-clip](./fixes/labels-radial-ring-orientation-clip.md) |
| axisLabel.rotate startAngle; radial startAngle 45; polar outerRadius clip | concentric / radial | [labels-radial-ring-orientation-clip](./fixes/labels-radial-ring-orientation-clip.md) |
| gauge labels overlap; every 10 piles up; small card dial illegible; show every other tick | gauge / radial | [labels-gauge-axis-overlap](./fixes/labels-gauge-axis-overlap.md) |
| __gauge_dial_s; resolveGaugeLabelStride; formatGaugeAxisLabel | gauge | [labels-gauge-axis-overlap](./fixes/labels-gauge-axis-overlap.md) |
| vertical pipe funnel label clipped; Application → pplication; pipe left label band | funnel / pipe | [labels-funnel-pipe-vertical-clip](./fixes/labels-funnel-pipe-vertical-clip.md) |
| PIPE_LABEL_BAND_V; textAlign right padL | funnel / pipe | [labels-funnel-pipe-vertical-clip](./fixes/labels-funnel-pipe-vertical-clip.md) |
| hover during intro; area series clipped mid chart; stuck dashed vertical line; axisPointer frozen; animation stopped on hover | area / line intro | [hover-focus-intro-axis-pointer-clip](./fixes/hover-focus-intro-axis-pointer-clip.md) |
| introLock; getZr().silent; updateAxisPointer leave mid-rollout | use-nq-echarts | [hover-focus-intro-axis-pointer-clip](./fixes/hover-focus-intro-axis-pointer-clip.md) |
| percent area empty; stackType percent no series; yAxis 20/40/60/80 empty plot; expanded area | area | [cartesian-stack-area-percent-empty](./fixes/cartesian-stack-area-percent-empty.md) |
| normalizeStackPercent missing on area; percent max 100 raw values | area / bar | [cartesian-stack-area-percent-empty](./fixes/cartesian-stack-area-percent-empty.md) |
| brush splits green/red; handle mid group; slider between Desktop Mobile; filter mid-cluster | brush / bar | [brush-band-edge-handles](./fixes/brush-band-edge-handles.md) |
| indexToPlotPercent center; boundaryGap brush left right edges | brush | [brush-band-edge-handles](./fixes/brush-band-edge-handles.md) |
| funnel stages reorder; On Deck jumps above Opportunities; sort descending hardcoded | funnel | [funnel-order-sort-none](./fixes/funnel-order-sort-none.md) |
| FunnelSort; sort none; pipeline stage order follows data | funnel | [funnel-order-sort-none](./fixes/funnel-order-sort-none.md) |
| onMarkClick excess property; composed props omit click; standalone props drop inherited | line / area / composed | [api-surface-standalone-props-drop-inherited](./fixes/api-surface-standalone-props-drop-inherited.md) |
| check:api; CartesianChartBaseProps; dist/types probe fails onMarkClick | api / types | [api-surface-standalone-props-drop-inherited](./fixes/api-surface-standalone-props-drop-inherited.md) |
| item focus opacity 0.2 on focused mark; emphasis state wrong | item-focus charts | Start [hover-focus domain](./domains/hover-focus.md), then chart-specific fix |
| `repairScatterHoverFocus` / `repairTreemapHoverFocus` / `repairFunnelHoverFocus` / `repairWaterfallHoverFocus` / `repairRadialHoverFocus` | echarts-core runtime | See scatter, treemap, funnel, waterfall, or radial fix note above |

<!-- Add semantic rows with user phrases, CI failures, and file names agents grep for -->

---

## File path quick map

| Path pattern | Domain |
|--------------|--------|
| `src/registry/echarts-core/scatter-hover-focus.ts` | hover-focus |
| `src/registry/echarts-core/treemap-hover-focus.ts` | hover-focus |
| `src/registry/echarts-core/funnel-hover-focus.ts` | hover-focus |
| `src/registry/echarts-core/pie-hover-focus.ts` | hover-focus |
| `src/registry/echarts-core/waterfall-hover-focus.ts` | hover-focus |
| `src/registry/echarts-core/radial-hover-focus.ts` | hover-focus |
| `src/registry/echarts-core/emphasis-presets.ts` | hover-focus |
| `src/registry/echarts-core/use-nq-echarts.ts` (mouseover / globalout) | hover-focus |
| `src/registry/echarts-core/compile-scatter.ts` | hover-focus |
| `src/registry/echarts-core/compile-treemap.ts` | hover-focus |
| `src/registry/echarts-core/compile-funnel.ts` | hover-focus, labels, funnel-order |
| `src/registry/echarts-core/compile-pie.ts` | hover-focus |
| `src/registry/echarts-core/funnel-layout.ts` | funnel-order |
| `src/registry/charts/funnel-chart.tsx` | funnel-order |
| `src/registry/echarts-core/compile-waterfall.ts` | hover-focus |
| `src/registry/echarts-core/compile-radial-bar.ts` | hover-focus, labels |
| `src/registry/echarts-core/compile-gauge.ts` | labels |
| `src/registry/echarts-core/gauge-axis-labels.ts` | labels |
| `src/registry/echarts-core/compile-area.ts` | cartesian-stack |
| `src/registry/echarts-core/compile-bar.ts` | cartesian-stack |
| `src/registry/echarts-core/stack-percent.ts` | cartesian-stack |
| `src/registry/echarts-core/chart-grid.ts` | brush |
| `src/registry/echarts-core/nq-chart-brush.tsx` | brush |
| `src/registry/charts/{line,area,composed}-chart.tsx` (props types) | api-surface |
| `scripts/check-api.mjs` | api-surface |
| `src/registry/echarts-core/create-cartesian-chart.tsx` (`CartesianChartBaseProps`) | api-surface |

---

## How to add an entry

1. Choose **domain** (existing or new `domains/<name>.md`) — see [frontmatter](./references/frontmatter.md).
2. Create **`fixes/<domain>-<slug>.md`** with required frontmatter.
3. Add one row to **Domain index** (if new domain) and one+ rows to **Semantic index**.
4. Link the fix from the domain file.
5. Run `pnpm skill:validate`.
