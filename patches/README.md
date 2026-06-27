## Patches

### `next-themes@0.4.6`

SSR-only ThemeScript (`if (typeof window !== "undefined") return null`) to avoid React 19 / Next.js App Router hydration warnings ([#385](https://github.com/pacocoursey/next-themes/issues/385)); upstream 0.4.6 does not include this fix.

## Dependency investigations (2026-06-10)

### ECharts

- **Pinned:** `^5.6.0` in `package.json`
- **Latest on npm:** `6.1.0` (major) — upgrade is a separate migration (API/bundle audit), not a drop-in bump.
- **Recommendation:** stay on 5.x until a dedicated upgrade pass; re-check `echarts/core` import paths and compiler snapshots before moving to 6.x.
