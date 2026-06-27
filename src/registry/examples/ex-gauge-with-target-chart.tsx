"use client";

import { BeeRadialChart, RadialBar, Tooltip, Legend } from "@/registry/charts/radial-chart";
import { normalizeGaugeValue, prepareGaugeRows } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const data = prepareGaugeRows({
  score: normalizeGaugeValue(72, 0, 100),
  target: 80,
});

const chartConfig = {
  score: {
    label: "Score",
    colors: {
      light: ["#3b82f6", "#10b981"],
      dark: ["#60a5fa", "#34d399"],
    },
  },
  target: {
    label: "Target",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
} satisfies ChartConfig;

/** Semi gauge — one row per arc; `series` matches `chartConfig` keys. */
export function BeeExampleGaugeWithTargetChart() {
  return (
    <BeeRadialChart
      className="h-full w-full p-4"
      data={data}
      nameKey="series"
      config={chartConfig}
      variant="semi"
    >
      <Tooltip />
      <Legend />
      <RadialBar dataKey="value" />
    </BeeRadialChart>
  );
}
