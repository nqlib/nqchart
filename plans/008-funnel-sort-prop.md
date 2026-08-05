# Plan 008 — Funnel `sort` prop (data-order default)

- **Status:** DONE
- **Written:** 2026-08-05
- **Effort:** S · **Risk:** low
- **Skills:** `nqchart-dev` / `fixed` / `nqchart-docs`

## Why

`compile-funnel` hardcodes ECharts `sort: "descending"`. Pipeline stages reorder whenever a later stage outgrows an earlier one (SecoLab: On Deck vs Opportunities). Consumer patched installed `0.2.1` to `sort: "none"`; nqlib should expose the control and default to data order so the patch can drop after publish.

## Scope — In

- `FunnelSort` type + `sort` on root / `Stages` / compile config
- Default `"none"` (preserve `data` array order); allow `"ascending"` | `"descending"`
- Native funnel series only (`pipe` already follows data order)
- Docs API row, consumer skill bullet, compiler test, fixed-skill note

## Scope — Out

- Publishing npm / bumping SecoLab (consumer drops patch after `@nqlib/nqchart` release)
- Pipe geometry changes

## Approach

Wire `sort` through `FunnelCompileConfig` + `FunnelStylePart` → `resolveFunnelLayout` → `compileFunnelOption` series field. Style-part / Stages wins over root, same as `orient` / `connection`.

## Acceptance

- [x] Default compile emits `sort: "none"`; `sort="descending"` still available
- [x] Stages with inverted values keep data order under default
- [x] Docs + consumer skill mention the prop
- [x] `.agents/skills/fixed/` note + `pnpm skill:validate`
- [x] `pnpm exec vitest run src/registry/echarts-core/__tests__/compile-funnel.test.ts`
