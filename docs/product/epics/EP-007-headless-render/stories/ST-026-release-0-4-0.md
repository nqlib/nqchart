---
id: ST-026
epic: EP-007
title: "Release 0.4.0"
status: ready
priority: must
estimate: 2
owner: nqchart
plan: plans/018-headless-render.md
---

# ST-026 — Release 0.4.0

As the consumer secolab,
I want nqchart 0.4.0 on npm with the changelog and the consumer skill updated,
so that I pin it and drop my patch.

## Acceptance criteria

- [ ] `package.json` version is `0.4.0`.
- [ ] `changelog.mdx` has the 0.4.0 entry.
- [ ] `docs/architecture/public-surface.md` lists the entry.
- [ ] `skills/consumer/nqchart/` has a headless page, and `pnpm sync:skills` ran.
- [ ] `pnpm run build:npm` and `pnpm verify:publish` pass.
- [ ] The tag `v0.4.0` is pushed.
- [ ] Hoang runs `pnpm publish:npm`.
- [ ] Verification gates from `docs/product/ai-contract.md` pass

## Out of scope

- The secolab bump to 0.4.0 and the patch deletion. secolab does these in its own repo.

## Blueprint

Technical how: [`plans/018-headless-render.md`](../../../../../plans/018-headless-render.md) (required for features).

## Notes

Publishing is the owner's step (`npm whoami`, OTP). Tagging does not publish.
