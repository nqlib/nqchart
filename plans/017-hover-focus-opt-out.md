# Plan 017 — hoverFocus opt-out

- **Status:** DONE
- **Written:** 2026-08-16
- **Effort:** M · **Risk:** low
- **Skills:** `nqchart-dev` / `nqchart-docs`
- **Story:** [ST-023](../docs/product/epics/EP-003-chart-craft/stories/ST-023-hover-focus-opt-out.md)

## Why

Hover-focus (hovered mark full opacity, siblings at `0.2`) is a library-wide contract with no consumer switch. Compact ledger / KPI charts want tooltip-only hover. Existing apps must keep today’s dim when they omit the prop.

## Scope — In

- `hoverFocus?: boolean` on every `NQ*Chart` root (default on)
- Compile: wrap focus presets with `hoverFocusOrOff`
- Runtime: skip pie/funnel/scatter/treemap/waterfall/radial repair when false
- Docs + consumer skill
- Showcase `/charts` toolbar + `WeeklyTrend` (consumer repo)

## Scope — Out

- Flipping the global default off
- Publishing npm
- Lab cases

## Approach

1. `CompileContext` / `CompileRootFields.hoverFocus?: boolean`. Default `ctx.hoverFocus !== false`.
2. `hoverFocusOrOff(enabled, focus)` in `emphasis-presets.ts` → `{ emphasis: { disabled: true } }` when off.
3. Wrap every `*Focus()` spread in `compile-*.ts`. Sparkline already disabled; accept the prop as a no-op.
4. Pass `hoverFocus` into `EChartsHost` → `use-nq-echarts`. Skip `schedule*Repair` / `repairScatterHoverFocus` when false; still `reset*` on leave.
5. Cannot infer off from `emphasis.disabled` — several families already set that and still dim via repair.

## Acceptance

- [x] Omit `hoverFocus` → same compiled emphasis as today
- [x] `hoverFocus: false` → `emphasis.disabled`, no `emphasis.focus`; repairs skipped
- [x] Verification gates from `docs/product/ai-contract.md` pass for touched surfaces
- [x] Consumer skill updated (`pnpm sync:skills`)
