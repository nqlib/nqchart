"use client";

import { BeeBarChart, Bar, XAxis, Grid, Tooltip, Legend } from "@/registry/charts/bar-chart";
import {
  DUAL_SERIES_CHART_CONFIG,
  formatMonthTickShort,
  TRAFFIC_MONTHLY_DATA,
} from "@/registry/examples/example-shared";

export function BeeExampleStrippedVariantBarChart() {
  return (
    <BeeBarChart
      data={[...TRAFFIC_MONTHLY_DATA]}
      config={DUAL_SERIES_CHART_CONFIG}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <Grid />
      <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
      <Legend isClickable />
      <Tooltip />
      <Bar dataKey="desktop" variant="stripped" />
      <Bar dataKey="mobile" variant="stripped" />
    </BeeBarChart>
  );
}
