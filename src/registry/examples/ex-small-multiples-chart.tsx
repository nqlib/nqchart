"use client";

import { NQLineChart, Grid, Line, Tooltip, XAxis, YAxis } from "@/registry/charts/line-chart";
import { NQSmallMultiples } from "@/registry/charts/small-multiples";
import { type ChartConfig } from "@/registry/ui/chart";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const REVENUE: Record<string, { revenue: number[]; plan: number[] }> = {
  "North America": { revenue: [42, 45, 51, 49, 56, 61], plan: [44, 46, 48, 50, 52, 54] },
  Europe: { revenue: [31, 29, 33, 36, 35, 39], plan: [30, 31, 32, 33, 34, 35] },
  "Asia Pacific": { revenue: [18, 22, 25, 30, 34, 41], plan: [20, 22, 24, 26, 28, 30] },
  "Latin America": { revenue: [9, 10, 9, 11, 12, 12], plan: [10, 10, 11, 11, 12, 12] },
};

const data = Object.entries(REVENUE).flatMap(([region, series]) =>
  MONTHS.map((month, i) => ({
    region,
    month,
    revenue: series.revenue[i] ?? 0,
    plan: series.plan[i] ?? 0,
  })),
);

const chartConfig = {
  revenue: { label: "Revenue", colors: { light: ["var(--chart-1)"], dark: ["var(--chart-1)"] } },
  plan: { label: "Plan", colors: { light: ["var(--chart-2)"], dark: ["var(--chart-2)"] } },
} satisfies ChartConfig;

/** Monthly revenue by region — one facet per region, one shared y-domain and legend. */
export function NQExampleSmallMultiplesChart() {
  return (
    <div className="min-h-full w-full self-start p-4">
      <NQSmallMultiples
        data={data}
        facetKey="region"
        valueKeys={["revenue", "plan"]}
        columns={2}
        facetHeight={110}
        config={chartConfig}
        legend
      >
        {(rows, facet) => (
          <NQLineChart
            data={rows}
            config={chartConfig}
            xDataKey="month"
            className="h-full w-full"
            showBrush={false}
          >
            <Grid />
            <XAxis dataKey="month" />
            <YAxis domain={facet.domain} tickFormatter={(v) => `$${String(v)}k`} />
            <Line dataKey="plan" variant="dashed" />
            <Line dataKey="revenue" curveType="monotone" />
            <Tooltip />
          </NQLineChart>
        )}
      </NQSmallMultiples>
    </div>
  );
}
