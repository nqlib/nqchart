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
`check:internals` resolves private `echarts/lib/...` imports and fails when React reaches the compile path or `dist/headless.*`. `check:size` gzips each family entry and the headless entry (echarts included) and fails on >5% growth. `smoke-dist.mjs` renders one composed chart to SVG from `dist/headless.mjs` and `dist/headless.cjs`.

## Git tag (release)

Tag the merge commit of the `dev` → `main` release PR. Do not push a commit to `main`.
Full steps: [`../conventions.md`](../conventions.md) § Release.

```bash
git switch main && git pull --ff-only
git tag -a vX.Y.Z -m "nqchart X.Y.Z — …"
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
pnpm preflight --full   # every CI check, including build:npm and next build
```

See [[registry/build-pipeline]] for local registry regeneration.
