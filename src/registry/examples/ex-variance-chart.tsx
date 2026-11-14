"use client";

import {
  NQComposedChart,
  Bar,
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "@/registry/charts/composed-chart";
import { prepareVarianceRows } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const raw = [
  { month: "Jan", actual: 118, plan: 110 },
  { month: "Feb", actual: 104, plan: 112 },
  { month: "Mar", actual: 131, plan: 120 },
  { month: "Apr", actual: 119, plan: 126 },
  { month: "May", actual: 142, plan: 130 },
  { month: "Jun", actual: 128, plan: 136 },
];

// Split Δ into two series so the good / bad colours follow `chartConfig`.
const data = prepareVarianceRows(raw, {
  categoryKey: "month",
  actualKey: "actual",
  planKey: "plan",
}).map((row) => ({
  month: row.category,
  favorable: row.good ? row.delta : null,
  unfavorable: row.good === false ? row.delta : null,
}));

const chartConfig = {
  favorable: {
    label: "Above plan",
    colors: { light: ["#059669"], dark: ["#34d399"] },
  },
  unfavorable: {
    label: "Below plan",
    colors: { light: ["#e11d48"], dark: ["#fb7185"] },
  },
} satisfies ChartConfig;

const signed = (value: unknown) => {
  const n = Number(value);
  return `${n > 0 ? "+" : ""}${n}`;
};

export function NQExampleVarianceChart() {
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
      <ReferenceLine y={0} variant="solid" includeInDomain={false} />
      <Bar dataKey="favorable" stackId="delta" showLabels labelFormatter={signed} />
      <Bar dataKey="unfavorable" stackId="delta" showLabels labelFormatter={signed} />
    </NQComposedChart>
  );
}
