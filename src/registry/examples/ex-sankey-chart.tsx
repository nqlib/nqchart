"use client";

import { NQSankeyChart, Tooltip } from "@/registry/charts/sankey-chart";
import { type ChartConfig } from "@/registry/ui/chart";

/** One quarter of visitors: channel → first page → signup → paid. */
const flows = [
  { source: "organic", target: "landing", visitors: 4200 },
  { source: "organic", target: "pricing", visitors: 1100 },
  { source: "ads", target: "landing", visitors: 3100 },
  { source: "ads", target: "pricing", visitors: 600 },
  { source: "social", target: "landing", visitors: 1800 },
  { source: "email", target: "pricing", visitors: 1400 },
  { source: "email", target: "landing", visitors: 500 },
  { source: "landing", target: "signup", visitors: 2900 },
  { source: "landing", target: "bounced", visitors: 6700 },
  { source: "pricing", target: "signup", visitors: 1500 },
  { source: "pricing", target: "bounced", visitors: 1600 },
  { source: "signup", target: "paid", visitors: 1250 },
  { source: "signup", target: "churned", visitors: 3150 },
];

// Keyed by node name — the colour and the display label of each node.
const chartConfig = {
  organic: { label: "Organic search", colors: { light: ["#3b82f6"], dark: ["#60a5fa"] } },
  ads: { label: "Paid ads", colors: { light: ["#8b5cf6"], dark: ["#a78bfa"] } },
  social: { label: "Social", colors: { light: ["#ec4899"], dark: ["#f472b6"] } },
  email: { label: "Email", colors: { light: ["#f59e0b"], dark: ["#fbbf24"] } },
  landing: { label: "Landing page", colors: { light: ["#0ea5e9"], dark: ["#38bdf8"] } },
  pricing: { label: "Pricing page", colors: { light: ["#14b8a6"], dark: ["#2dd4bf"] } },
  signup: { label: "Signed up", colors: { light: ["#10b981"], dark: ["#34d399"] } },
  bounced: { label: "Bounced", colors: { light: ["#9ca3af"], dark: ["#6b7280"] } },
  paid: { label: "Paid", colors: { light: ["#059669"], dark: ["#10b981"] } },
  churned: { label: "Churned", colors: { light: ["#f87171"], dark: ["#ef4444"] } },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function NQExampleSankeyChart() {
  return (
    <NQSankeyChart
      className="h-full w-full p-4"
      data={flows}
      valueKey="visitors"
      config={chartConfig}
      formatValue={(v) => compact.format(v)}
      a11yLabel="Visitor flow from acquisition channel to paid conversion"
    >
      <Tooltip />
    </NQSankeyChart>
  );
}
