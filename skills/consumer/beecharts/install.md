# Install BeeCharts components

BeeCharts is a **shadcn registry**, not an npm package. Chart source is copied into your repo with the shadcn CLI. Agent skills (separate command) only install markdown guidance — see [Agent skill](#agent-skill-cursor-claude-code-etc) below.

## 1. Peer dependencies

Install once per app:

```bash
pnpm add echarts motion
```

Charts declare `echarts` and `motion` (motion.dev) as dependencies.

## 2. Register the BeeCharts namespace

Add to your project's `components.json`:

```json
{
  "registries": {
    "@beecharts": "https://beecharts.vercel.app/r/{name}.json"
  }
}
```

Or install by full URL without the namespace:

```bash
pnpm dlx shadcn@latest add https://beecharts.vercel.app/r/bar-chart.json
```

Requires shadcn/ui initialized (`pnpm dlx shadcn@latest init`). See [/docs/installation](https://beecharts.vercel.app/docs/installation).

## 3. Add chart components (shadcn CLI)

Use your package runner with **shadcn add** — this copies files into `components/beecharts/` (charts + ui) and `lib/chart-recipes.ts` when applicable:

```bash
pnpm dlx shadcn@latest add @beecharts/<chart-name>
```

Examples:

```bash
pnpm dlx shadcn@latest add @beecharts/bar-chart
pnpm dlx shadcn@latest add @beecharts/line-chart
pnpm dlx shadcn@latest add @beecharts/chart @beecharts/tooltip @beecharts/legend
```

Installing a chart automatically adds its `registryDependencies`.

## Chart recipes (BI helpers)

```bash
pnpm dlx shadcn@latest add @beecharts/chart-recipes
```

Installs `lib/chart-recipes.ts`. Use with primitives — see [recipes.md](./recipes.md) and `/docs/chart-recipes`.

## Registry packages by chart

| Chart CLI | Pulls UI deps (typical) |
|-----------|------------------------|
| `@beecharts/area-chart` | chart, tooltip, legend, dot, bee-brush, background |
| `@beecharts/line-chart` | same as area |
| `@beecharts/bar-chart` | chart, tooltip, legend, bee-brush, background |
| `@beecharts/composed-chart` | chart, tooltip, legend, dot, bee-brush, background |
| `@beecharts/pie-chart` | chart, tooltip, legend, background |
| `@beecharts/radial-chart` | chart, tooltip, legend, background |
| `@beecharts/radar-chart` | chart, tooltip, legend, dot, background |
| `@beecharts/scatter-chart` | chart, tooltip, legend, dot, background |
| `@beecharts/treemap-chart` | chart, tooltip, legend, background |
| `@beecharts/funnel-chart` | chart, tooltip, legend, background |
| `@beecharts/waterfall-chart` | chart, tooltip, legend, background |
| `@beecharts/sparkline-chart` | chart, tooltip, dot, background |
| `@beecharts/heatmap-chart` | chart, tooltip, legend, background |
| `@beecharts/calendar-chart` | chart, tooltip, legend, background |
| `@beecharts/chart-recipes` | none (data helpers only) |

## CLI blocks (full dashboard widgets)

```bash
pnpm dlx shadcn@latest add @beecharts/monospace-bar-chart
pnpm dlx shadcn@latest add @beecharts/hover-trace-bar-chart
```

See `/docs/bar-chart/blocks` and [examples.md](./examples.md).

## UI-only installs

| CLI | When |
|-----|------|
| `@beecharts/chart` | Required base — always needed |
| `@beecharts/tooltip` | If building custom tooltips |
| `@beecharts/legend` | If building custom legends |
| `@beecharts/dot` | Custom dots outside bundled charts |
| `@beecharts/background` | Custom backgrounds |
| `@beecharts/bee-brush` | Standalone brush experiments |

## Import paths (after shadcn install)

```tsx
import { BeeBarChart, Bar, XAxis, YAxis, Grid, Tooltip, Legend } from "@/components/beecharts/charts/bar-chart";
import { type ChartConfig } from "@/components/beecharts/ui/chart";
import { binForHistogram, prepareBulletRow } from "@/lib/chart-recipes";
```

Paths may use `@/registry/...` inside the beecharts repo; consumer apps use `components/beecharts/...` and `lib/chart-recipes.ts`.

## Agent skill (Cursor, Claude Code, etc.)

**Does not install chart source.** The [skills CLI](https://ui.shadcn.com/docs/skills) copies markdown into `.agents/skills/beecharts/` so agents know which chart to pick and how to compose it:

```bash
# List skills in the BeeCharts repo
npx skills add ctesibius/beecharts --list

# Install consumer skill into your app project
npx skills add ctesibius/beecharts --skill beecharts -y
```

Documented on [/docs/installation](https://beecharts.vercel.app/docs/installation).

HTTP fallback: `https://beecharts.vercel.app/.well-known/agent-skills/beecharts/SKILL.md`

## Docs

- Primitives: `/docs/bar-chart`, `/docs/line-chart`, etc.
- Recipes: `/docs/chart-recipes`
- Copy patterns from registry examples: see [examples.md](./examples.md)
