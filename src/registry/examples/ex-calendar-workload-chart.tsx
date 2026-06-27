"use client";

import {
  BeeCalendarChart,
  Calendar,
  Tooltip,
  Legend,
} from "@/registry/charts/calendar-chart";
import { prepareCalendarWorkloadCells } from "@/registry/lib/chart-recipes";
import {
  MAYA_MONTH_WORKLOAD,
  WORKLOAD_UTILIZATION_CONFIG,
} from "@/registry/examples/workload-demo-data";

const { cells, min, max, range } = prepareCalendarWorkloadCells(MAYA_MONTH_WORKLOAD);

export function BeeExampleCalendarWorkloadChart() {
  return (
    <BeeCalendarChart config={WORKLOAD_UTILIZATION_CONFIG} className="h-full w-full p-4">
      <Calendar
        dataKey="utilization"
        data={cells}
        range={range}
        min={min}
        max={max}
        cellSize={22}
      />
      <Legend />
      <Tooltip />
    </BeeCalendarChart>
  );
}
