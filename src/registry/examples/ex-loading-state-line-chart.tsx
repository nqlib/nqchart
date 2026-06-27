"use client";

import { BeeLineChart, Line, XAxis, Grid, Legend, Tooltip } from "@/registry/charts/line-chart";
import {
  DUAL_SERIES_CHART_CONFIG,
  formatMonthTickShort,
  TRAFFIC_MONTHLY_DATA,
} from "@/registry/examples/example-shared";

export function BeeExampleLoadingStateLineChart() {
  return (
    <BeeLineChart
      data={[...TRAFFIC_MONTHLY_DATA]}
      config={DUAL_SERIES_CHART_CONFIG}
      className="h-full w-full p-4"
      xDataKey="month"
      isLoading
    >
      <Grid />
      <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
      <Legend />
      <Tooltip />
      <Line dataKey="desktop" />
      <Line dataKey="mobile" curveType="monotone" />
    </BeeLineChart>
  );
}
