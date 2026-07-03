"use client";

import { NQRadialChart, RadialBar, Tooltip, Legend } from "@/registry/charts/radial-chart";
import { normalizeGaugeValue } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const TARGET = 80;

const data = [{ series: "score", value: normalizeGaugeValue(72, 0, 100) }];

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

/** KPI dial + target needle — single row, `<RadialBar target={…} />`. */
export function NQExampleGaugeWithTargetChart() {
  return (
    <NQRadialChart
      className="h-full w-full p-4"
      data={data}
      nameKey="series"
      config={chartConfig}
      variant="semi"
    >
      <Tooltip />
      <Legend />
      <RadialBar dataKey="value" target={TARGET} />
    </NQRadialChart>
  );
}
