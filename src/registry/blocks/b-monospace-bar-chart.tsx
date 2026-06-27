"use client";

import { useMemo } from "react";
import { BeeBarChart, Bar, XAxis } from "@/registry/charts/bar-chart";
import { type ChartConfig } from "@/registry/ui/chart";
import {
  formatMonthTickShort,
  TRAFFIC_MONTHLY_DATA,
} from "@/registry/examples/example-shared";

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

const totalSales = TRAFFIC_MONTHLY_DATA.reduce((sum, row) => sum + row.desktop, 0);

const topMonth = TRAFFIC_MONTHLY_DATA.reduce(
  (best, row) => (row.desktop > best.desktop ? row : best),
  TRAFFIC_MONTHLY_DATA[0],
);

export function BeeMonospaceBarChart() {
  const data = useMemo(
    () => TRAFFIC_MONTHLY_DATA.map(({ month, desktop }) => ({ month, desktop })),
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[$] Total Sales"}</span>
            <span className="text-primary font-mono text-3xl">
              <span className="text-muted-foreground text-xl font-normal">$</span>
              <span className="tracking-tighter">{totalSales.toLocaleString()}</span>
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Top Month"}</span>
            <span className="text-primary font-mono text-3xl">
              <span className="tracking-tighter">{topMonth.month.slice(0, 3)}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// X-AXIS: "}
            <span className="text-primary">MONTHS</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// Y-AXIS: "}
            <span className="text-primary">SALES</span>
          </span>
        </div>
      </div>
      <hr className="my-4 border-t border-dashed" />
      <BeeBarChart
        data={data}
        config={chartConfig}
        xDataKey="month"
        barRadius={0}
        showBrush={false}
        className="min-h-0 flex-1"
      >
        <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
        <Bar dataKey="desktop" variant="monospace" radius={0} />
      </BeeBarChart>
    </div>
  );
}
