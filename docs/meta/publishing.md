# Publishing

NQChart ships two surfaces from the same `src/registry/` tree:

1. **npm** — `@nqlib/nqchart` (versioned package; this is what nqui-showcase and SecoLab install).
2. **shadcn registry** — JSON at `/r/{name}.json` on the Vercel docs site (copy source into the app).

Git tags (`v0.3.0`, …) mark the tree. **`pnpm publish:npm` is a separate human step** — tagging does not publish.

## What gets deployed (Vercel)

- Next.js docs/landing app
- Registry payloads at `/r/{name}.json` (built to `public/r/` during `pnpm build`)
- Agent skill static files at `/.well-known/agent-skills/` (via `pnpm sync:skills`)

## npm package

```bash
pnpm run build:npm        # dist/ + types + check:dist + check:api + check:internals + check:size
pnpm run verify:publish   # prepublishOnly gate
pnpm publish:npm          # optional OTP: -- --otp=123456
```

`check:api` type-probes `dist/types/` so inherited props (`onMarkClick` on line/area/composed) cannot silently drop.
`check:internals` resolves private `echarts/lib/...` imports. `check:size` gzips each family entry (echarts included) and fails on >5% growth.

## Git tag (release)

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm run build:npm
git tag -a vX.Y.Z -m "nqchart X.Y.Z — …"
git push origin HEAD
git push origin vX.Y.Z
```

Then publish npm when ready. Do not force-push tags.

## Build pipeline (CI / Vercel)

```bash
pnpm sync:skills          # consumer skill → .agents + public/.well-known
pnpm run registry:fresh   # part of pnpm build
pnpm build                # registry:fresh + next build
```

## Registry namespace

Users configure:

```json
{
  "registries": {
    "@nqchart": "https://nqchart.vercel.app/r/{name}.json"
  }
}
```

## Verification before deploy / tag

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm run audit:previews
pnpm run audit:registry-boundary
pnpm skill:validate
pnpm run build:npm
pnpm build
```

See [[registry/build-pipeline]] for local registry regeneration.
