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

/** A quarterly P&L, read top to bottom like the statement. Values in $k. */
const PNL_DATA = [
  { name: "revenue", value: 1240, type: "start" },
  { name: "cogs", value: -520, type: "decrease" },
  { name: "gross-profit", value: 720, type: "total" },
  { name: "sales-marketing", value: -210, type: "decrease" },
  { name: "research", value: -160, type: "decrease" },
  { name: "g-and-a", value: -90, type: "decrease" },
  { name: "other-income", value: 35, type: "increase" },
  { name: "operating-income", value: 295, type: "total" },
  { name: "tax", value: -62, type: "decrease" },
  { name: "net-income", value: 233, type: "total" },
];

const PNL_CONFIG = {
  revenue: { label: "Revenue" },
  cogs: { label: "Cost of goods sold" },
  "gross-profit": { label: "Gross profit" },
  "sales-marketing": { label: "Sales & marketing" },
  research: { label: "R&D" },
  "g-and-a": { label: "G&A" },
  "other-income": { label: "Other income" },
  "operating-income": { label: "Operating income" },
  tax: { label: "Tax" },
  "net-income": { label: "Net income" },
} satisfies ChartConfig;

export function NQExampleWaterfallHorizontalPnl() {
  return (
    <NQWaterfallChart
      data={PNL_DATA}
      config={PNL_CONFIG}
      layout="horizontal"
      className="h-full w-full p-4"
    >
      <Grid /><XAxis /><YAxis /><Bars /><Legend /><Tooltip />
    </NQWaterfallChart>
  );
}
