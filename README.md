# BeeCharts

Composable React chart components powered by **Apache ECharts**, distributed as a shadcn-compatible registry. A re-imagining of the [evilcharts](https://github.com/ali-tas/evilcharts) UX with ECharts as the render engine instead of Recharts.

- Compound component API (`BeeBarChart`, `<Bar />`, `<Grid />`, …)
- `ChartConfig` design tokens (light/dark CSS variables on `[data-chart]`)
- `chart-recipes` data helpers for BI patterns

See [docs/index.md](./docs/index.md) for maintainer architecture notes and [skills/README.md](./skills/README.md) for agent skills.

## Installation

Add the BeeCharts namespace to your project's `components.json`:

```json
{
  "registries": {
    "@beecharts": "https://beecharts.vercel.app/r/{name}.json"
  }
}
```

Then add any chart (its dependencies — `@beecharts/chart`, `@beecharts/tooltip`, etc. — resolve automatically):

```bash
pnpm dlx shadcn@latest add @beecharts/radar-chart
```

Or skip the namespace config and install by direct URL:

```bash
pnpm dlx shadcn@latest add https://beecharts.vercel.app/r/radar-chart.json
```

## v1 charts

Bar, line, composed, pie, heatmap, gauge.

## Development

```bash
corepack enable
pnpm install
pnpm dev
pnpm run registry:fresh
pnpm sync:skills
pnpm exec tsc --noEmit
```

Contributors: read [AGENTS.md](./AGENTS.md) and [docs/index.md](./docs/index.md).

Registry namespace: `@beecharts/*`
