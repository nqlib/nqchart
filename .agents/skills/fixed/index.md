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

Last updated: 2026-06-27

---

## Domain index

Problem areas → domain overview → individual fix notes.

| Domain | Symptoms (short) | Domain doc | Fix notes |
|--------|------------------|------------|-----------|
| **hover-focus** | Hover dims wrong mark; flicker; tile/point vanishes; stale bright siblings; `__highByOuter` | [domains/hover-focus.md](./domains/hover-focus.md) | [scatter symbol blur](./fixes/hover-focus-scatter-symbol-blur.md), [treemap flicker / vanish](./fixes/hover-focus-treemap-flicker-vanish.md), [funnel blur / flicker](./fixes/hover-focus-funnel-blur.md), [waterfall blur / flicker](./fixes/hover-focus-waterfall-blur.md), [radial blur / flicker](./fixes/hover-focus-radial-blur.md) |

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
| waterfall hover dims hovered column; waterfall flicker; stale bright bars | waterfall | [hover-focus-waterfall-blur](./fixes/hover-focus-waterfall-blur.md) |
| waterfall stacked bar blur; __wf_values__ emphasis.disabled | waterfall | [hover-focus-waterfall-blur](./fixes/hover-focus-waterfall-blur.md) |
| radial hover dims hovered ring; rose petal flicker; stale bright rings | radial | [hover-focus-radial-blur](./fixes/hover-focus-radial-blur.md) |
| polar bar series focus gap flicker; radial emphasis.disabled | radial | [hover-focus-radial-blur](./fixes/hover-focus-radial-blur.md) |
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
| `src/registry/echarts-core/waterfall-hover-focus.ts` | hover-focus |
| `src/registry/echarts-core/radial-hover-focus.ts` | hover-focus |
| `src/registry/echarts-core/emphasis-presets.ts` | hover-focus |
| `src/registry/echarts-core/use-nq-echarts.ts` (mouseover / globalout) | hover-focus |
| `src/registry/echarts-core/compile-scatter.ts` | hover-focus |
| `src/registry/echarts-core/compile-treemap.ts` | hover-focus |
| `src/registry/echarts-core/compile-funnel.ts` | hover-focus |
| `src/registry/echarts-core/compile-waterfall.ts` | hover-focus |
| `src/registry/echarts-core/compile-radial-bar.ts` | hover-focus |

---

## How to add an entry

1. Choose **domain** (existing or new `domains/<name>.md`) — see [frontmatter](./references/frontmatter.md).
2. Create **`fixes/<domain>-<slug>.md`** with required frontmatter.
3. Add one row to **Domain index** (if new domain) and one+ rows to **Semantic index**.
4. Link the fix from the domain file.
5. Run `pnpm skill:validate`.
