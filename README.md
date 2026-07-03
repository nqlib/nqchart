# NQChart

**Composable React charts for dashboards and BI** — Apache ECharts engine, shadcn registry install, compound `NQ*Chart` API.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/hero-dashboard-dark.png">
    <img src="docs/assets/readme/hero-dashboard-light.png" alt="NQChart SaaS revenue dashboard demo with area, stacked bar, radial gauge, and pie charts" width="920">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/nqlib/nqchart"><strong>Repository</strong></a> ·
  <a href="https://github.com/nqlib/nqchart/tree/Released/docs">Docs (in repo)</a> ·
  <a href="https://github.com/nqlib/nqchart/blob/Released/src/content/docs/installation.mdx">Installation</a>
</p>

<p align="center">
  <a href="https://github.com/nqlib/nqchart/stargazers"><img src="https://img.shields.io/github/stars/nqlib/nqchart?style=flat&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/nqlib/nqchart/blob/Released/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
</p>

---

## Why NQChart

- **Compound components** — compose `<Bar />`, `<Grid />`, `<Legend />` as children, not a giant options object
- **Theme-aware** — `ChartConfig` maps to CSS variables for light/dark
- **You own the source** — install via shadcn registry into `components/nqchart/`
- **BI recipes** — histogram, Pareto, bullet, heatmap, gauge on primitives + `chart-recipes`

Inspired by the [evilcharts](https://github.com/ali-tas/evilcharts) UX, rebuilt on **ECharts** instead of Recharts.

## Chart gallery

<p align="center">
  <img src="docs/assets/readme/gallery-light.png" alt="NQChart chart type gallery" width="920">
</p>

<table align="center">
  <tr>
    <td align="center"><img src="docs/assets/readme/charts/bar-stacked.png" width="400" alt="Stacked bar chart"><br><sub>Stacked bar</sub></td>
    <td align="center"><img src="docs/assets/readme/charts/area-brush.png" width="400" alt="Area chart with brush"><br><sub>Area + brush</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/assets/readme/charts/radial-gauge.png" width="400" alt="Radial gauge"><br><sub>Radial / gauge</sub></td>
    <td align="center"><img src="docs/assets/readme/charts/funnel.png" width="400" alt="Funnel chart"><br><sub>Funnel</sub></td>
  </tr>
  <tr>
    <td align="center" colspan="2"><img src="docs/assets/readme/charts/waterfall.png" width="400" alt="Waterfall chart"><br><sub>Waterfall</sub></td>
  </tr>
</table>

## Quick install

Add the registry namespace to `components.json`:

```json
{
  "registries": {
    "@nqchart": "https://nqchart.vercel.app/r/{name}.json"
  }
}
```

Install a chart (peer deps: `echarts`, `motion`):

```bash
pnpm add echarts motion
pnpm dlx shadcn@latest add @nqchart/bar-chart
```

Optional agent skill for Cursor / Claude Code:

```bash
npx skills add nqlib/nqchart --skill nqchart -y
```

Full steps: [installation docs](src/content/docs/installation.mdx).

## Primitives

Bar · line · area · composed · pie · radial · radar · scatter · funnel · waterfall · treemap · heatmap · calendar · sparkline

## Development

```bash
corepack enable
pnpm install
pnpm dev                 # http://localhost:3000
pnpm run registry:fresh
pnpm sync:skills
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

### Refresh README screenshots

After UI changes, regenerate marketing assets (builds + starts the app automatically):

```bash
pnpm build
pnpm capture:readme
```

Or capture from a deployed URL:

```bash
BASE_URL=https://your-deploy.example.com pnpm capture:readme
```

Upload `docs/assets/readme/social-preview.png` to **GitHub → Settings → General → Social preview** for link cards.

---

Contributors: [AGENTS.md](./AGENTS.md) · [docs/index.md](./docs/index.md) · [skills/README.md](./skills/README.md)
