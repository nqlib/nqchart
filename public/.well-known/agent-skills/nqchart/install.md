# Install NQChart components

NQChart is a **shadcn registry**, not an npm package. Chart source is copied into your repo with the shadcn CLI. Agent skills (separate command) only install markdown guidance — see [Agent skill](#agent-skill-cursor-claude-code-etc) below.

## 1. Peer dependencies

Install once per app:

```bash
pnpm add echarts motion
```

Charts declare `echarts` and `motion` (motion.dev) as dependencies.

## 2. Register the NQChart namespace

Add to your project's `components.json`:

```json
{
  "registries": {
    "@nqchart": "https://nqchart.vercel.app/r/{name}.json"
  }
}
```

Or install by full URL without the namespace:

```bash
pnpm dlx shadcn@latest add https://nqchart.vercel.app/r/bar-chart.json
```

Requires shadcn/ui initialized (`pnpm dlx shadcn@latest init`). See [/docs/installation](https://nqchart.vercel.app/docs/installation).

## 3. Add chart components (shadcn CLI)

Use your package runner with **shadcn add** — this copies files into `components/nqchart/` (charts + ui) and `lib/chart-recipes.ts` when applicable:

```bash
pnpm dlx shadcn@latest add @nqchart/<chart-name>
```

Examples:

```bash
pnpm dlx shadcn@latest add @nqchart/bar-chart
pnpm dlx shadcn@latest add @nqchart/line-chart
pnpm dlx shadcn@latest add @nqchart/chart @nqchart/tooltip @nqchart/legend
```

Installing a chart automatically adds its `registryDependencies`.

## Chart recipes (BI helpers)

```bash
pnpm dlx shadcn@latest add @nqchart/chart-recipes
```

Installs `lib/chart-recipes.ts`. Use with primitives — see [recipes.md](./recipes.md) and `/docs/chart-recipes`.

## Registry packages by chart

| Chart CLI | Pulls UI deps (typical) |
|-----------|------------------------|
| `@nqchart/area-chart` | chart, tooltip, legend, dot, nq-brush, background |
| `@nqchart/line-chart` | same as area |
| `@nqchart/bar-chart` | chart, tooltip, legend, nq-brush, background |
| `@nqchart/composed-chart` | chart, tooltip, legend, dot, nq-brush, background |
| `@nqchart/pie-chart` | chart, tooltip, legend, background |
| `@nqchart/radial-chart` | chart, tooltip, legend, background |
| `@nqchart/radar-chart` | chart, tooltip, legend, dot, background |
| `@nqchart/scatter-chart` | chart, tooltip, legend, dot, background |
| `@nqchart/treemap-chart` | chart, tooltip, legend, background |
| `@nqchart/funnel-chart` | chart, tooltip, legend, background |
| `@nqchart/waterfall-chart` | chart, tooltip, legend, background |
| `@nqchart/sparkline-chart` | chart, tooltip, dot, background |
| `@nqchart/heatmap-chart` | chart, tooltip, legend, background |
| `@nqchart/calendar-chart` | chart, tooltip, legend, background |
| `@nqchart/chart-recipes` | none (data helpers only) |

## CLI blocks (full dashboard widgets)

```bash
pnpm dlx shadcn@latest add @nqchart/monospace-bar-chart
pnpm dlx shadcn@latest add @nqchart/hover-trace-bar-chart
```

See `/docs/bar-chart/blocks` and [examples.md](./examples.md).

## UI-only installs

| CLI | When |
|-----|------|
| `@nqchart/chart` | Required base — always needed |
| `@nqchart/tooltip` | If building custom tooltips |
| `@nqchart/legend` | If building custom legends |
| `@nqchart/dot` | Custom dots outside bundled charts |
| `@nqchart/background` | Custom backgrounds |
| `@nqchart/nq-brush` | Standalone brush experiments |

## Import paths (after shadcn install)

```tsx
import { NQBarChart, Bar, XAxis, YAxis, Grid, Tooltip, Legend } from "@/components/nqchart/charts/bar-chart";
import { type ChartConfig } from "@/components/nqchart/ui/chart";
import { binForHistogram, prepareBulletRow } from "@/lib/chart-recipes";
```

Paths may use `@/registry/...` inside the nqchart repo; consumer apps use `components/nqchart/...` and `lib/chart-recipes.ts`.

## Agent skill (Cursor, Claude Code, etc.)

**Does not install chart source.** The [skills CLI](https://ui.shadcn.com/docs/skills) copies markdown into `.agents/skills/nqchart/` so agents know which chart to pick and how to compose it:

```bash
# List skills in the NQChart repo
npx skills add ctesibius/nqchart --list

# Install consumer skill into your app project
npx skills add ctesibius/nqchart --skill nqchart -y
```

Documented on [/docs/installation](https://nqchart.vercel.app/docs/installation).

HTTP fallback: `https://nqchart.vercel.app/.well-known/agent-skills/nqchart/SKILL.md`

## Docs

- Primitives: `/docs/bar-chart`, `/docs/line-chart`, etc.
- Recipes: `/docs/chart-recipes`
- Copy patterns from registry examples: see [examples.md](./examples.md)
