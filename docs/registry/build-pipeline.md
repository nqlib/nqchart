# Registry build pipeline

## Commands

```bash
pnpm run registry:fresh    # clean + build
pnpm run registry:build    # tsx ./src/scripts/build-registry.mts
pnpm run audit:previews    # MDX ComponentPreview ↔ registry
pnpm run audit:registry-boundary
```

## Outputs

| Artifact | Committed? | Purpose |
|----------|------------|---------|
| `src/registry/__index__.tsx` | Yes | Registry index for docs previews |
| `registry.json` | Yes | shadcn registry manifest |
| `public/r/*.json` | No (gitignored) | Install payloads for `shadcn add` |
| `.source/` | No (gitignored) | fumadocs-mdx generated |

A fresh clone typechecks without running `registry:build` because `__index__.tsx` and `registry.json` are committed.

## Workflow: add or change a registry item

1. Edit files under `src/registry/`.
2. Register in the matching `src/registry/registry-*.ts` manifest.
3. Run `pnpm run registry:fresh`.
4. Commit regenerated `__index__.tsx` and `registry.json`.
5. Run `pnpm run audit:previews`.
6. Add/update MDX in `src/content/docs/` with `<ComponentPreview name="ex-…" />`.

## Install namespace

Users add `@nqchart/{slug}` via shadcn CLI. Registry namespace config:

```json
{
  "registries": {
    "@nqchart": "https://nqchart.vercel.app/r/{name}.json"
  }
}
```

See [[meta/publishing]] for deploy notes.
