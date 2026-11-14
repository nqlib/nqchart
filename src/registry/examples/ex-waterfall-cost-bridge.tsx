"use client";

import {
  Bars,
  Grid,
  Legend,
  NQWaterfallChart,
  Tooltip,
  XAxis,
  YAxis,
} from "@/registry/charts/waterfall-chart";
import type { ChartConfig } from "@/registry/ui/chart";

/**
 * Monthly cloud cost, budget to actual. A cost going up is bad, so
 * `higherIsBetter={false}` colors increases red and savings green.
 */
const COST_DATA = [
  { name: "budget", value: 48, type: "start" },
  { name: "compute", value: 9, type: "increase" },
  { name: "storage", value: 3, type: "increase" },
  { name: "reserved", value: -7, type: "decrease" },
  { name: "egress", value: 2, type: "increase" },
  { name: "rightsizing", value: -4, type: "decrease" },
  { name: "actual", value: 51, type: "total" },
];

const COST_CONFIG = {
  budget: { label: "Budget" },
  compute: { label: "Compute" },
  storage: { label: "Storage" },
  reserved: { label: "Reserved" },
  egress: { label: "Egress" },
  rightsizing: { label: "Rightsizing" },
  actual: { label: "Actual" },
  increase: { label: "Cost up" },
  decrease: { label: "Saving" },
} satisfies ChartConfig;

export function NQExampleWaterfallCostBridge() {
  return (
    <NQWaterfallChart
      data={COST_DATA}
      config={COST_CONFIG}
      higherIsBetter={false}
      showBrush={false}
      className="h-full w-full p-4"
    >
      <Grid /><XAxis /><YAxis /><Bars /><Legend /><Tooltip />
    </NQWaterfallChart>
  );
}
