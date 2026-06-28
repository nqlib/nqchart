---
name: beecharts-fixed-domain-hover-focus
description: >-
  Hover-focus domain — wrong opacity, flicker, vanishing tiles, stale emphasis, and
  ECharts blur/emphasis state bugs in scatter, treemap, funnel, waterfall, and other item-focus charts.
skill: beecharts-fixed
kind: domain
domain: hover-focus
tags: hover, focus, blur, emphasis, flicker, opacity, scatter, treemap, funnel, waterfall, echarts-state
metadata:
  author: beecharts
  version: "1.0.0"
---

# Domain: hover-focus

BeeCharts hover contract: **one mark at full opacity, all others at `0.2`**. Spec: [`emphasis-presets.ts`](../../../../src/registry/echarts-core/emphasis-presets.ts), public doc [`hover-focus.mdx`](../../../../src/content/docs/hover-focus.mdx).

## When this domain applies

- Wrong opacity on hover (focused mark dims, or siblings stay bright).
- Flicker when moving pointer between marks.
- Mark **disappears** or turns gap/border color on hover.
- Runtime state bugs (`emphasis` / `blur` / `__highByOuter` / `__needsUpdateStatus`).

## Layers

| Layer | Role |
|-------|------|
| `emphasis-presets.ts` | Compile-time `blur` / `emphasis` / `stateAnimation` / treemap+funnel+waterfall `disabled` |
| `compile-*.ts` | Per-chart option; scatter per-row `itemFocus` for Symbol quirk |
| `use-bee-echarts.ts` | `mouseover` / `globalout` → runtime repair hooks |
| `*-hover-focus.ts` | Sync ECharts graphic hover states when built-in pipeline is wrong |

## ECharts pitfalls (shared)

1. **Symbol (scatter):** dispatcher is a **group**; blur hits `childAt(0)` path even on the hovered point.
2. **`__highByOuter`:** after `enterEmphasis`, blurSeries skips re-blurring stale paths → multiple bright marks.
3. **`__needsUpdateStatus`:** must set on chart instance + `getZr().wakeUp()` after manual state changes or styles do not repaint.
4. **Treemap emphasis styles:** parent/bg `emphasis.fill` = gap `borderColor` — **`enterEmphasis` makes tiles look vanished**; keep hovered tile in **normal** state, blur siblings only.
5. **Treemap native high-down + repair:** double pipeline causes flicker; use `emphasis.disabled: true` + BeeCharts repair only.
6. **Treemap layout tween:** default `animationDurationUpdate` ~900ms → set `0` on series + in `apply-chart-animation.ts`.
7. **Funnel:** same native+repair race as treemap on adjacent stages — use `funnelFocus()` + `funnel-hover-focus.ts`.
8. **Waterfall:** stacked placeholder + values series races native index focus — use `waterfallColumnFocus()` + `waterfall-hover-focus.ts` on `__wf_values__`.

## Fixed incidents

| ID | Summary | Fix note |
|----|---------|----------|
| scatter-symbol-blur | Hovered scatter dot dims; stale multi-focus | [../fixes/hover-focus-scatter-symbol-blur.md](../fixes/hover-focus-scatter-symbol-blur.md) |
| treemap-flicker-vanish | Treemap flicker; hovered tile disappears | [../fixes/hover-focus-treemap-flicker-vanish.md](../fixes/hover-focus-treemap-flicker-vanish.md) |
| funnel-blur | Funnel hover dim / flicker; stale bright stages | [../fixes/hover-focus-funnel-blur.md](../fixes/hover-focus-funnel-blur.md) |
| waterfall-blur | Waterfall hover dim / flicker; stale bright columns | [../fixes/hover-focus-waterfall-blur.md](../fixes/hover-focus-waterfall-blur.md) |

## Before adding a new fix here

- Confirm mapping in `emphasis-presets.ts` (index / item / series focus) is correct for geometry.
- Prefer compile-time presets first; add runtime repair only when ECharts state machine is wrong (scatter, treemap).
- Do **not** re-enable treemap `enterEmphasis` on hovered tile without checking bg/content fill behavior.
