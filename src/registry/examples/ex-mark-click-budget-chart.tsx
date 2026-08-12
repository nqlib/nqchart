"use client";

import {
  NQBarChart,
  Bar,
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "@/registry/charts/bar-chart";
import {
  DUAL_SERIES_CHART_CONFIG,
  formatMonthTickShort,
  TRAFFIC_MONTHLY_DATA,
} from "@/registry/examples/example-shared";
import { useState } from "react";

const BUDGET_CAP = 280;

/** Cross-filter + budget-cap pattern for BI boards. */
export function NQExampleMarkClickBudgetChart() {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full flex-col gap-2 p-4">
      <p className="text-xs text-muted-foreground">
        {selectedMonth
          ? `Filtered to ${selectedMonth} (shift-click extends in a real board)`
          : "Click a bar to filter · dashed line is the budget cap"}
      </p>
      <NQBarChart
        config={DUAL_SERIES_CHART_CONFIG}
        data={[...TRAFFIC_MONTHLY_DATA]}
        xDataKey="month"
        className="min-h-0 flex-1 w-full"
        showBrush={false}
        onMarkClick={(event) => {
          const month = String(event.category);
          setSelectedMonth((prev) =>
            event.modifiers.shift && prev ? `${prev}, ${month}` : month,
          );
        }}
      >
        <Grid />
        <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
        <YAxis tickFormatter={(v) => String(v)} />
        <Legend />
        <Tooltip />
        <Bar dataKey="desktop" />
        <ReferenceLine y={BUDGET_CAP} label="Budget" tone="warning" variant="dashed" />
      </NQBarChart>
    </div>
  );
}
