"use client";

import { useMemo, useState } from "react";
import {
  NQCalendarChart,
  Calendar,
  Tooltip as CalendarTooltip,
  Legend as CalendarLegend,
} from "@/registry/charts/calendar-chart";
import {
  NQHeatmapChart,
  Heatmap,
  Tooltip as HeatmapTooltip,
  Legend as HeatmapLegend,
} from "@/registry/charts/heatmap-chart";
import {
  prepareCalendarWorkloadCells,
  prepareTeamWorkloadMatrix,
} from "@/registry/lib/chart-recipes";
import {
  WORKLOAD_TEAM_ROWS,
  WORKLOAD_UTILIZATION_CONFIG,
  WORKLOAD_WEEK_DATES,
  computeTeamWorkloadSummary,
  workloadDaysForEmployee,
  workloadEmployeeNames,
} from "@/registry/examples/workload-demo-data";

type WorkloadView = "team" | "employee";

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-4 py-3">
      <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-medium tabular-nums">{value}</p>
      {detail ? <p className="text-muted-foreground mt-1 text-xs">{detail}</p> : null}
    </div>
  );
}

export function NQExampleWorkloadDashboardChart() {
  const [view, setView] = useState<WorkloadView>("team");
  const [employee, setEmployee] = useState("Maya Chen");

  const summary = useMemo(
    () => computeTeamWorkloadSummary(WORKLOAD_WEEK_DATES, WORKLOAD_TEAM_ROWS),
    [],
  );

  const teamMatrix = useMemo(
    () => prepareTeamWorkloadMatrix([...WORKLOAD_WEEK_DATES], WORKLOAD_TEAM_ROWS),
    [],
  );

  const employeeCalendar = useMemo(() => {
    const days = workloadDaysForEmployee(employee);
    return prepareCalendarWorkloadCells(days);
  }, [employee]);

  const employees = workloadEmployeeNames();

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Team avg utilization"
          value={`${summary.avgUtilization}%`}
          detail="Assigned ÷ available, this week"
        />
        <MetricCard
          label="Overbooked slots"
          value={String(summary.overbookedSlots)}
          detail="Person-days at or above 100%"
        />
        <MetricCard
          label="Open capacity"
          value={`${summary.openHours.toFixed(0)}h`}
          detail="Unassigned hours this week"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="border-input bg-background inline-flex rounded-md border p-0.5"
          role="group"
          aria-label="Workload view"
        >
          {(["team", "employee"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={
                view === key
                  ? "bg-muted rounded-sm px-3 py-1.5 text-xs font-medium"
                  : "text-muted-foreground rounded-sm px-3 py-1.5 text-xs font-medium"
              }
            >
              {key === "team" ? "Team week" : "Employee month"}
            </button>
          ))}
        </div>

        {view === "employee" ? (
          <select
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            aria-label="Select employee"
            className="border-input bg-background h-8 w-[200px] rounded-md border px-2 text-sm"
          >
            {employees.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="min-h-0 min-w-0 flex-1">
        {view === "team" ? (
          <NQHeatmapChart config={WORKLOAD_UTILIZATION_CONFIG} className="h-full w-full">
            <Heatmap
              dataKey="utilization"
              data={teamMatrix.cells}
              xLabels={teamMatrix.colLabels}
              yLabels={teamMatrix.rowLabels}
              min={teamMatrix.min}
              max={teamMatrix.max}
              enableZoom={false}
            />
            <HeatmapLegend />
            <HeatmapTooltip />
          </NQHeatmapChart>
        ) : (
          <NQCalendarChart config={WORKLOAD_UTILIZATION_CONFIG} className="h-full w-full">
            <Calendar
              dataKey="utilization"
              data={employeeCalendar.cells}
              range={employeeCalendar.range}
              min={employeeCalendar.min}
              max={employeeCalendar.max}
              cellSize={22}
            />
            <CalendarLegend />
            <CalendarTooltip />
          </NQCalendarChart>
        )}
      </div>
    </div>
  );
}
