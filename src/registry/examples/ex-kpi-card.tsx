"use client";

import { NQKpiCard } from "@/registry/charts/kpi-card";

const usdCompact = (v: number) =>
  `$${v.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
const percent = (v: number) =>
  v.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 1 });
const integer = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 });

/** A dashboard KPI row: revenue (up is good), churn (down is good), NPS (flat), pipeline vs target. */
export function NQExampleKpiCard() {
  return (
    // `self-start` + `min-h-full` keeps the row centred yet scrollable when the cards wrap taller than the frame.
    <div className="grid min-h-full w-full grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] content-center gap-3 self-start p-4">
      <NQKpiCard
        label="Revenue"
        value={1_284_000}
        previousValue={1_142_000}
        formatValue={usdCompact}
        comparisonLabel="vs last month"
        sparkline={[920, 980, 1010, 990, 1080, 1142, 1210, 1284]}
        color="var(--chart-1)"
      />
      <NQKpiCard
        label="Churn"
        value={0.021}
        previousValue={0.026}
        higherIsBetter={false}
        formatValue={percent}
        comparisonLabel="vs last month"
        sparkline={[3.1, 2.9, 3.0, 2.8, 2.6, 2.6, 2.3, 2.1]}
        color="var(--chart-2)"
      />
      <NQKpiCard
        label="NPS"
        value={42}
        previousValue={42}
        formatValue={integer}
        deltaFormat="absolute"
        comparisonLabel="vs last quarter"
        sparkline={[38, 41, 40, 43, 42, 41, 42, 42]}
        color="var(--chart-3)"
      />
      <NQKpiCard
        label="Pipeline"
        value={3_600_000}
        previousValue={3_950_000}
        target={5_000_000}
        formatValue={usdCompact}
        comparisonLabel="vs last week"
        color="var(--chart-4)"
      />
    </div>
  );
}
