"use client";

import {
  NQComposedChart,
  Line,
  Connector,
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "@/registry/charts/composed-chart";
import { prepareDumbbellRows } from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

const raw = [
  { team: "Support", before: 62, after: 81 },
  { team: "Sales", before: 70, after: 84 },
  { team: "Design", before: 78, after: 85 },
  { team: "Finance", before: 74, after: 72 },
  { team: "Ops", before: 68, after: 61 },
];

const data = prepareDumbbellRows(raw, {
  categoryKey: "team",
  fromKey: "before",
  toKey: "after",
});

const chartConfig = {
  from: {
    label: "Q1",
    colors: { light: ["#94a3b8"], dark: ["#64748b"] },
  },
  to: {
    label: "Q2",
    colors: { light: ["#2563eb"], dark: ["#60a5fa"] },
  },
  connector: {
    label: "Change",
    colors: { light: ["#cbd5e1"], dark: ["#475569"] },
  },
} satisfies ChartConfig;

export function NQExampleDumbbellChart() {
  return (
    <NQComposedChart
      config={chartConfig}
      data={data}
      xDataKey="category"
      className="h-full w-full p-4"
      showBrush={false}
    >
      <Grid />
      <XAxis dataKey="category" />
      <YAxis domain={[50, 100]} />
      <Legend />
      <Tooltip />
      <Connector fromKey="from" toKey="to" />
      <Line dataKey="from" variant="dots" />
      <Line dataKey="to" variant="dots" />
    </NQComposedChart>
  );
}
