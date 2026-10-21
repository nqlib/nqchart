---
name: npm-package-is-primary
description: Users install NQChart from the npm package @nqlib/nqchart; the shadcn registry is a secondary path from the same source
type: decision
created: 2026-08-01
updated: 2026-10-21
---

Users install NQChart with `pnpm add @nqlib/nqchart echarts motion` and import each chart family
from its subpath (`@nqlib/nqchart/bar-chart`). This is the primary distribution. The shadcn registry
(`shadcn add @nqchart/<chart>`) copies the same `src/registry/` source into an app. It is a
secondary path: keep it working, but design the API for the npm package first.

**Why:** the developer decided this on 2026-10-21. The consumers (SecoLab, nqui-showcase) already
install the npm package. The earlier note ("registry, not npm") contradicted the README, the
installation page, and the consumer skill, which all lead with npm.

**How to apply:** the npm public surface (`dist/types`, the subpath entries, the peers) is the
contract. `check:api`, `check:size`, and `check:internals` guard it in CI. Do not split the
library into one npm package per chart family. A new chart is a registry item, an example, an MDX
preview, and a subpath entry in the npm build.
