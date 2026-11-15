"use client";

import { Grid, NQScatterChart, Scatter, Tooltip, XAxis, YAxis } from "@/registry/charts/scatter-chart";
import type { ChartConfig } from "@/registry/ui/chart";

// Payload sizes span 1 KB to 50 MB. On a linear axis every point below 1 MB
// sits in one column at the left; a log axis gives each order of magnitude
// the same width.
const REQUESTS = [
  { kb: 1.2, ms: 38 },
  { kb: 3.5, ms: 41 },
  { kb: 9, ms: 44 },
  { kb: 24, ms: 52 },
  { kb: 60, ms: 58 },
  { kb: 140, ms: 71 },
  { kb: 410, ms: 96 },
  { kb: 980, ms: 130 },
  { kb: 2600, ms: 210 },
  { kb: 7400, ms: 390 },
  { kb: 18000, ms: 720 },
  { kb: 51000, ms: 1480 },
];

const REQUEST_CONFIG = {
  requests: {
    label: "Requests",
    colors: { light: ["#047857"], dark: ["#10b981"] },
  },
} satisfies ChartConfig;

const formatKb = (value: unknown) => {
  const kb = Number(value);
  return kb >= 1000 ? `${(kb / 1000).toLocaleString()} MB` : `${kb.toLocaleString()} KB`;
};

export function NQExampleScatterLogAxis() {
  return (
    <NQScatterChart config={REQUEST_CONFIG} className="h-full w-full p-4">
      <Grid />
      <XAxis dataKey="kb" scale="log" tickFormatter={formatKb} />
      <YAxis dataKey="ms" scale="log" tickFormatter={(v) => `${Number(v).toLocaleString()} ms`} />
      <Tooltip />
      <Scatter dataKey="requests" data={REQUESTS} />
    </NQScatterChart>
  );
}
