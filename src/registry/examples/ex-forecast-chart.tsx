"use client";

import {
  NQComposedChart,
  Line,
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  RangeArea,
} from "@/registry/charts/composed-chart";
import { prepareForecastSeries } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const raw = [
  { month: "Jan", revenue: 120 },
  { month: "Feb", revenue: 132 },
  { month: "Mar", revenue: 128 },
  { month: "Apr", revenue: 141 },
  { month: "May", revenue: 155 },
  { month: "Jun", revenue: 149 },
  { month: "Jul", projected: 158, low: 146, high: 170 },
  { month: "Aug", projected: 165, low: 148, high: 182 },
  { month: "Sep", projected: 171, low: 148, high: 194 },
  { month: "Oct", projected: 178, low: 149, high: 207 },
];

const data = prepareForecastSeries(raw, {
  dateKey: "month",
  actualKey: "revenue",
  forecastKey: "projected",
  lowerKey: "low",
  upperKey: "high",
});

const today = data.filter((row) => row.actual != null).at(-1)!.month;

const chartConfig = {
  actual: {
    label: "Actual",
    colors: { light: ["#047857"], dark: ["#34d399"] },
  },
  forecast: {
    label: "Forecast",
    colors: { light: ["#b45309"], dark: ["#fbbf24"] },
  },
} satisfies ChartConfig;

export function NQExampleForecastChart() {
  return (
    <NQComposedChart
      config={chartConfig}
      data={data}
      xDataKey="month"
      className="h-full w-full p-4"
      showBrush={false}
    >
      <Grid />
      <XAxis dataKey="month" />
      <YAxis />
      <Legend />
      <Tooltip />
      <RangeArea lowKey="lower" highKey="upper" tone="warning" label="Confidence" />
      <ReferenceLine x={today} label="Today" labelPosition="end" />
      <Line dataKey="actual" />
      <Line dataKey="forecast" variant="dashed" />
    </NQComposedChart>
  );
}
