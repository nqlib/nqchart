---
name: audit-ignores
description: Why pnpm.auditConfig.ignoreGhsas holds GHSA-vfj7-8cjw-p6xm (braces) and when to drop it
type: decision
created: 2026-10-21
---

`package.json` → `pnpm.auditConfig.ignoreGhsas` ignores **GHSA-vfj7-8cjw-p6xm** (braces, high,
stack-exhaustion DoS through deeply nested patterns). CI runs `pnpm audit --audit-level=high`.

**Why:** no fixed release exists. `braces` 3.0.3 is the latest version and is in the vulnerable
range. The only path is dev-only lint tooling:
`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. It reads
repo-controlled globs at lint time. It does not ship in `@nqlib/nqchart` or run on the docs site.

**How to apply:** do not add an ignore for an advisory that has a fix. Pin a transitive fix in
`pnpm.overrides` inside the current major (`"pkg@^N": "^N.x.y"`). Remove this ignore when
`braces` publishes a fix or `@next/eslint-plugin-next` drops `fast-glob`; then re-run
`pnpm audit --audit-level=high`.
