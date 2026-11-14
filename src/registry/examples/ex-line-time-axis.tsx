"use client";

import { Grid, Line, NQLineChart, Tooltip, XAxis } from "@/registry/charts/line-chart";
import type { ChartConfig } from "@/registry/ui/chart";

// Readings on irregular dates: a time axis spaces them by the real gap between
// the dates, so the long pause in April shows as a long segment.
const BUILD_TIME_DATA = [
  { date: "2026-01-05", minutes: 14.2 },
  { date: "2026-01-12", minutes: 13.8 },
  { date: "2026-01-14", minutes: 15.1 },
  { date: "2026-02-02", minutes: 12.6 },
  { date: "2026-02-20", minutes: 11.9 },
  { date: "2026-03-03", minutes: 12.4 },
  { date: "2026-03-05", minutes: 9.7 },
  { date: "2026-05-18", minutes: 8.9 },
  { date: "2026-05-29", minutes: 9.3 },
  { date: "2026-06-15", minutes: 7.8 },
];

const BUILD_TIME_CONFIG = {
  minutes: {
    label: "Build time (min)",
    colors: { light: ["#047857"], dark: ["#10b981"] },
  },
} satisfies ChartConfig;

export function NQExampleLineTimeAxis() {
  return (
    <NQLineChart
      data={BUILD_TIME_DATA}
      config={BUILD_TIME_CONFIG}
      className="h-full w-full p-4"
      xDataKey="date"
    >
      <Grid />
      <XAxis dataKey="date" scale="time" />
      <Tooltip />
      <Line dataKey="minutes" />
    </NQLineChart>
  );
}
