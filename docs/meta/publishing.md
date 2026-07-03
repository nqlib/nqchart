# Publishing

NQChart is **not** published as npm packages. Distribution is via the **shadcn registry** hosted on Vercel.

## What gets deployed

- Next.js docs/landing app
- Registry payloads at `/r/{name}.json` (built to `public/r/` during `pnpm build`)
- Agent skill static files at `/.well-known/agent-skills/` (via `pnpm sync:skills`)

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

## Verification before deploy

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm run audit:previews
pnpm run audit:registry-boundary
pnpm skill:validate
pnpm build
```

## Not in scope

- `@nqchart/*` npm packages
- npm `publish` workflow for chart source (users copy via shadcn CLI)

See [[registry/build-pipeline]] for local registry regeneration.
