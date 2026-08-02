---
name: registry-shadcn-not-npm
description: NQChart product distribution is shadcn registry source under src/registry/, not per-chart npm packages
type: decision
created: 2026-08-01
---

Consumers install charts with `pnpm dlx shadcn@latest add @nqchart/<chart>`. The maintainer product
surface is `src/registry/` (+ committed `registry.json` / `public/r`). Do not invent separate npm
packages per chart family or treat `dist/` as the primary consumer install path for the docs-site
product.

**Why:** one primitive per family + registry copy-into-app is the published contract
(`docs/architecture/overview.md`, consumer skill). npm `@nqlib/nqchart` may exist for local/monorepo
sync; it does not replace the registry model.

**How to apply:** new charts = registry item + example + MDX preview; update consumer skill only when
user-facing API changes.
