"use client";

import { NQPieChart, Pie, Tooltip, Legend } from "@/registry/charts/pie-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { channel: "search", visits: 4200 },
  { channel: "direct", visits: 3800 },
  { channel: "social", visits: 2600 },
  { channel: "email", visits: 1800 },
  { channel: "referral", visits: 1500 },
  { channel: "partners", visits: 900 },
  { channel: "ads", visits: 600 },
  { channel: "other", visits: 400 },
];

const chartConfig = {
  search: { label: "Search", colors: { light: ["#4f6bd8"], dark: ["#7189ea"] } },
  direct: { label: "Direct", colors: { light: ["#8cc96f"], dark: ["#a3d98a"] } },
  social: { label: "Social", colors: { light: ["#f7c552"], dark: ["#f9d37a"] } },
  email: { label: "Email", colors: { light: ["#ec6464"], dark: ["#f08585"] } },
  referral: { label: "Referral", colors: { light: ["#72bddd"], dark: ["#93cde6"] } },
  partners: { label: "Partners", colors: { light: ["#3d9f6f"], dark: ["#5cb88a"] } },
  ads: { label: "Ads", colors: { light: ["#f98453"], dark: ["#fb9f78"] } },
  other: { label: "Other", colors: { light: ["#9963b2"], dark: ["#b388c7"] } },
} satisfies ChartConfig;

/** Rose pie — slice angle and length both follow the value, largest first. */
export function NQExamplePieRoseChart() {
  return (
    <NQPieChart
      className="h-full w-full p-4"
      data={data}
      nameKey="channel"
      config={chartConfig}
    >
      <Legend />
      <Tooltip />
      <Pie dataKey="visits" nameKey="channel" rose="radius" />
    </NQPieChart>
  );
}
