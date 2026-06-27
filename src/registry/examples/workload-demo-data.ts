import {
  workloadUtilization,
  type TeamWorkloadRow,
  type WorkloadDay,
} from "@/registry/lib/chart-recipes";
import { type ChartConfig } from "@/registry/ui/chart";

export const WORKLOAD_WEEK_DATES = [
  "2025-06-02",
  "2025-06-03",
  "2025-06-04",
  "2025-06-05",
  "2025-06-06",
] as const;

export const WORKLOAD_TEAM_ROWS: TeamWorkloadRow[] = [
  {
    employee: "Maya Chen",
    availableByDay: [8, 8, 8, 8, 8],
    assignedByDay: [6.5, 7.2, 9.5, 8, 5],
  },
  {
    employee: "Jordan Lee",
    availableByDay: [8, 8, 8, 8, 8],
    assignedByDay: [8, 8.5, 7, 6, 4],
  },
  {
    employee: "Sam Okonkwo",
    availableByDay: [8, 8, 8, 8, 8],
    assignedByDay: [5, 6, 8.2, 9.5, 7],
  },
  {
    employee: "Riley Park",
    availableByDay: [8, 8, 8, 8, 8],
    assignedByDay: [3, 4.5, 5, 6.5, 2],
  },
  {
    employee: "Alex Rivera",
    availableByDay: [8, 8, 8, 8, 8],
    assignedByDay: [10, 11, 9, 8.5, 7.5],
  },
];

/** June 2025 — Maya Chen; weekdays 8h capacity. */
export const MAYA_MONTH_WORKLOAD: WorkloadDay[] = [
  { date: "2025-06-02", availableHours: 8, assignedHours: 6.5 },
  { date: "2025-06-03", availableHours: 8, assignedHours: 7.2 },
  { date: "2025-06-04", availableHours: 8, assignedHours: 9.5 },
  { date: "2025-06-05", availableHours: 8, assignedHours: 8 },
  { date: "2025-06-06", availableHours: 8, assignedHours: 5 },
  { date: "2025-06-09", availableHours: 8, assignedHours: 7.8 },
  { date: "2025-06-10", availableHours: 8, assignedHours: 10.2 },
  { date: "2025-06-11", availableHours: 8, assignedHours: 6 },
  { date: "2025-06-12", availableHours: 8, assignedHours: 4.5 },
  { date: "2025-06-13", availableHours: 8, assignedHours: 8.5 },
  { date: "2025-06-16", availableHours: 8, assignedHours: 3 },
  { date: "2025-06-17", availableHours: 8, assignedHours: 7 },
  { date: "2025-06-18", availableHours: 8, assignedHours: 8.8 },
  { date: "2025-06-19", availableHours: 8, assignedHours: 11 },
  { date: "2025-06-20", availableHours: 8, assignedHours: 6.2 },
  { date: "2025-06-23", availableHours: 8, assignedHours: 5.5 },
  { date: "2025-06-24", availableHours: 8, assignedHours: 7.5 },
  { date: "2025-06-25", availableHours: 8, assignedHours: 9 },
  { date: "2025-06-26", availableHours: 8, assignedHours: 8.2 },
  { date: "2025-06-27", availableHours: 8, assignedHours: 4 },
  { date: "2025-06-30", availableHours: 8, assignedHours: 6.8 },
];

export const WORKLOAD_UTILIZATION_CONFIG = {
  utilization: {
    label: "Utilization",
    colors: {
      light: ["#ecfdf5", "#34d399", "#b45309", "#dc2626"],
      dark: ["#064e3b", "#34d399", "#fbbf24", "#f87171"],
    },
  },
} satisfies ChartConfig;

export function workloadEmployeeNames() {
  return WORKLOAD_TEAM_ROWS.map((row) => row.employee);
}

export function workloadDaysForEmployee(employee: string): WorkloadDay[] {
  if (employee === "Maya Chen") return MAYA_MONTH_WORKLOAD;

  const row = WORKLOAD_TEAM_ROWS.find((r) => r.employee === employee);
  if (!row) return [];

  return WORKLOAD_WEEK_DATES.map((date, index) => ({
    date,
    availableHours: row.availableByDay[index] ?? 0,
    assignedHours: row.assignedByDay[index] ?? 0,
  }));
}

export function computeTeamWorkloadSummary(
  dates: readonly string[],
  rows: TeamWorkloadRow[],
) {
  let totalAvailable = 0;
  let totalAssigned = 0;
  let overbookedSlots = 0;

  for (const row of rows) {
    for (let i = 0; i < dates.length; i++) {
      const available = row.availableByDay[i] ?? 0;
      const assigned = row.assignedByDay[i] ?? 0;
      totalAvailable += available;
      totalAssigned += assigned;
      if (available > 0 && assigned / available >= 1) overbookedSlots += 1;
    }
  }

  return {
    avgUtilization: workloadUtilization(totalAssigned, totalAvailable),
    overbookedSlots,
    openHours: Math.max(0, totalAvailable - totalAssigned),
  };
}
