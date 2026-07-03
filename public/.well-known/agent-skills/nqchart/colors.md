# Theme-aware colors

NQChart resolves series colors from `chartConfig` at runtime. Keys **must match** series `dataKey` / slice `nameKey` values.

---

## Preferred: CSS palette tokens

The demo dashboard and most registry examples use `--chart-1` … `--chart-5` from your global theme. They adapt to light/dark without duplicating hex values.

Copy this helper into your app (repo source: `src/registry/examples/chart-tokens.ts`):

```ts
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export function chartColorByIndex(index: number) {
  const len = CHART_COLORS.length;
  return CHART_COLORS[((index % len) + len) % len]!;
}

export function chartConfigColor(index: number): { light: [string]; dark: [string] } {
  const color = chartColorByIndex(index);
  return { light: [color], dark: [color] };
}

export function chartConfigGradient(
  startIndex: number,
  endIndex: number,
): { light: [string, string]; dark: [string, string] } {
  return {
    light: [chartColorByIndex(startIndex), chartColorByIndex(endIndex)],
    dark: [chartColorByIndex(startIndex), chartColorByIndex(endIndex)],
  };
}
```

Ensure `globals.css` defines `--chart-1` … `--chart-5` for `:root` and `.dark` (shadcn chart palette).

### Single-series config

```ts
import { type ChartConfig } from "@nqlib/nqchart";
import { chartConfigColor } from "@/lib/chart-tokens";

export const MRR_CONFIG = {
  mrr: { label: "MRR", colors: chartConfigColor(3) },
} satisfies ChartConfig;
```

### Multi-series dashboard

```ts
export const MOVEMENT_CONFIG = {
  new: { label: "New + expansion", colors: chartConfigColor(1) },
  churned: { label: "Churned", colors: chartConfigColor(4) },
} satisfies ChartConfig;
```

### Gradient gauge (radial semi)

Two-stop gradients work on radial arcs and area fills:

```ts
export const ACTIVATION_CONFIG = {
  activation: {
    label: "Activated",
    colors: {
      light: [chartColorByIndex(3), chartColorByIndex(2)],
      dark: [chartColorByIndex(3), chartColorByIndex(2)],
    },
  },
} satisfies ChartConfig;
```

**Canonical reference:** `src/components/landing/dashboard-data.ts` (homepage demo).

---

## Alternative: explicit light/dark hex

Use when you need brand-specific colors unrelated to the theme palette:

```ts
const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: { light: ["#059669"], dark: ["#34d399"] },
  },
  mobile: {
    label: "Mobile",
    colors: { light: ["#e11d48"], dark: ["#fb7185"] },
  },
} satisfies ChartConfig;
```

**Canonical reference:** `src/registry/examples/example-shared.ts` (`DUAL_SERIES_CHART_CONFIG`).

---

## Heatmap intensity scales

Heatmaps often use a **multi-stop** ramp in one config key:

```ts
const chartConfig = {
  intensity: {
    label: "Sessions",
    colors: {
      light: ["#fff7ed", "#f97316", "#9a3412"],
      dark: ["#431407", "#ea580c", "#fdba74"],
    },
  },
} satisfies ChartConfig;
```

See `ex-heatmap-chart`.

---

## Rules

| Rule | Why |
|------|-----|
| Always `satisfies ChartConfig` | Catches typos in keys and color shape |
| Provide **both** `light` and `dark` arrays | ECharts resolves against the active theme |
| One config key per `dataKey` / slice name | Mismatched keys → wrong or missing colors |
| Prefer `var(--chart-N)` for dashboards | Matches demo app; survives theme tweaks |
| Do not hardcode colors on `<Bar />` children | Colors come from `config` only |

NQChart resolves `var(--token)` to computed RGB before passing colors to ECharts, so CSS variables work in canvas rendering.
