"use client";

import { NQRadialChart, RadialBar, Tooltip } from "@/registry/charts/radial-chart";
import { type ChartConfig } from "@/registry/ui/chart";

/** `series` must match a key in `chartConfig` — that value selects the gradient. */
const data = [{ series: "score", value: 72 }];

const chartConfig = {
  score: {
    label: "NPS",
    colors: {
      light: ["#3b82f6", "#10b981"],
      dark: ["#60a5fa", "#34d399"],
    },
  },
} satisfies ChartConfig;

/** KPI-style semi-circle gauge — `NQRadialChart` with `variant="semi"`. */
export function NQExampleGaugeChart() {
  return (
    <NQRadialChart
      className="h-full w-full p-4"
      data={data}
      nameKey="series"
      config={chartConfig}
      variant="semi"
    >
      <Tooltip />
      <RadialBar dataKey="value" />
    </NQRadialChart>
  );
}
