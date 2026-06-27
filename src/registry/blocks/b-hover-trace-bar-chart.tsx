"use client";

import { useCallback, useMemo, useState } from "react";
import { BeeBarChart, Bar, Tooltip, XAxis } from "@/registry/charts/bar-chart";
import { peakBarIndex } from "@/registry/echarts-core/hover-trace-bar";
import { type ChartConfig } from "@/registry/ui/chart";
import { formatMonthTickShort, TRAFFIC_MONTHLY_DATA } from "@/registry/examples/example-shared";

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: { light: ["#18181b"], dark: ["#fafafa"] },
  },
} satisfies ChartConfig;

export function BeeHoverTraceBarChart() {
  const data = useMemo(
    () => TRAFFIC_MONTHLY_DATA.map(({ month, desktop }) => ({ month, desktop })),
    [],
  );
  const peakIndex = useMemo(() => peakBarIndex(data, "desktop"), [data]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const selectedIndex = hoverIndex ?? peakIndex;
  const selected = data[selectedIndex] ?? data[peakIndex] ?? data[0]!;

  const handleHoverTraceChange = useCallback((index: number | null) => {
    setHoverIndex(index);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground font-mono text-xs">{"[desktop] Value"}</p>
          <p className="font-mono text-3xl tabular-nums tracking-tighter">
            {selected.desktop.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-muted-foreground font-mono text-[10px]">{"[month]"}</p>
          <p className="font-mono text-xs">{selected.month}</p>
        </div>
      </div>
      <BeeBarChart
        data={data}
        config={chartConfig}
        xDataKey="month"
        className="min-h-0 flex-1"
        showBrush={false}
        onHoverTraceChange={handleHoverTraceChange}
      >
        <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
        <Tooltip hide />
        <Bar dataKey="desktop" variant="hover-trace" />
      </BeeBarChart>
    </div>
  );
}
