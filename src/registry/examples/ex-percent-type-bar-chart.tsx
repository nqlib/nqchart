"use client";

import { NQBarChart, Bar, XAxis, Grid, Tooltip, Legend } from "@/registry/charts/bar-chart";
import {
  DUAL_SERIES_CHART_CONFIG,
  formatMonthTickShort,
  TRAFFIC_MONTHLY_DATA,
} from "@/registry/examples/example-shared";

export function NQExamplePercentTypeBarChart() {
  return (
    <NQBarChart
      data={[...TRAFFIC_MONTHLY_DATA]}
      config={DUAL_SERIES_CHART_CONFIG}
      className="h-full w-full p-4"
      xDataKey="month"
      stackType="percent"
    >
      <Grid />
      <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
      <Legend isClickable />
      <Tooltip />
      <Bar dataKey="desktop" />
      <Bar dataKey="mobile" />
    </NQBarChart>
  );
}
