/** Data helpers for common BI chart shapes — use with primitive NQ*Chart components. */

const formatBin = (value: number) => {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

/** Bin numeric samples for use with `NQBarChart` (`bin` + `count` keys). */
export function binForHistogram(values: number[], binCount = 8) {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const step = span / binCount;
  const counts = Array.from({ length: binCount }, () => 0);

  for (const value of values) {
    const index = Math.min(binCount - 1, Math.floor((value - min) / step));
    counts[index] = (counts[index] ?? 0) + 1;
  }

  return counts.map((count, index) => {
    const start = min + index * step;
    const end = start + step;
    return {
      bin: `${formatBin(start)}–${formatBin(end)}`,
      count,
    };
  });
}

/** Sort by value, add `count` and `cumulative` (0–100) for Pareto / composed charts. */
export function prepareParetoData<TData extends Record<string, unknown>>(
  data: TData[],
  nameKey: string,
  valueKey: string,
) {
  const sorted = [...data].sort(
    (a, b) => Number(b[valueKey] ?? 0) - Number(a[valueKey] ?? 0),
  );
  const total = sorted.reduce((sum, row) => sum + Number(row[valueKey] ?? 0), 0) || 1;
  let cumulative = 0;

  return sorted.map((row) => {
    const count = Number(row[valueKey] ?? 0);
    cumulative += count;
    return {
      ...row,
      count,
      cumulative: Number(((cumulative / total) * 100).toFixed(1)),
    };
  });
}

export type HeatmapCell = {
  row: string;
  col: string;
  x: number;
  y: number;
  value: number;
};

export type WorkloadDay = {
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  availableHours: number;
  assignedHours: number;
};

export type CalendarCell = {
  date: string;
  /** Utilization percent — assigned ÷ available × 100. */
  value: number;
  assignedHours: number;
  availableHours: number;
};

/** Utilization percent for workload monitoring (0 when available is 0). */
export function workloadUtilization(assignedHours: number, availableHours: number) {
  if (availableHours <= 0) return 0;
  return Number(((assignedHours / availableHours) * 100).toFixed(1));
}

/**
 * Map daily capacity + assignments into calendar cells for `NQCalendarChart`.
 * `value` is utilization %; values above 100 indicate overbooking.
 */
export function prepareCalendarWorkloadCells(
  days: WorkloadDay[],
  options?: { min?: number; max?: number },
): { cells: CalendarCell[]; min: number; max: number; range: string | [string, string] } {
  const cells: CalendarCell[] = days.map((day) => {
    const value = workloadUtilization(day.assignedHours, day.availableHours);
    return {
      date: day.date,
      value,
      assignedHours: day.assignedHours,
      availableHours: day.availableHours,
    };
  });

  if (cells.length === 0) {
    const month = new Date().toISOString().slice(0, 7);
    return { cells: [], min: 0, max: 100, range: month };
  }

  const values = cells.map((c) => c.value);
  const min = options?.min ?? Math.min(...values);
  const max = options?.max ?? Math.max(...values, 100);

  const dates = cells.map((c) => c.date).sort();
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const range =
    first.slice(0, 7) === last.slice(0, 7) ? first.slice(0, 7) : ([first, last] as [string, string]);

  return { cells, min, max, range };
}

export type TeamWorkloadRow = {
  employee: string;
  /** Daily available hours (same length as `dates`). */
  availableByDay: number[];
  /** Daily assigned hours (same length as `dates`). */
  assignedByDay: number[];
};

/**
 * Flatten team × day utilization into a heatmap matrix for `NQHeatmapChart`.
 * Rows are employees; columns are short date labels (e.g. `Mon 3`).
 */
export function prepareTeamWorkloadMatrix(
  dates: string[],
  rows: TeamWorkloadRow[],
  options?: { dateFormatter?: (iso: string) => string },
): { cells: HeatmapCell[]; min: number; max: number; rowLabels: string[]; colLabels: string[] } {
  const formatDate =
    options?.dateFormatter ??
    ((iso: string) => {
      const d = new Date(`${iso}T12:00:00`);
      return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    });

  const rowLabels = rows.map((r) => r.employee);
  const colLabels = dates.map(formatDate);
  const matrix = rows.map((row) =>
    dates.map((_, i) =>
      workloadUtilization(row.assignedByDay[i] ?? 0, row.availableByDay[i] ?? 0),
    ),
  );

  const { cells, min, max } = prepareHeatmapCells(rowLabels, colLabels, matrix);
  return { cells, min, max: Math.max(max, 100), rowLabels, colLabels };
}

/** Flatten a row × column matrix for categorical heatmaps on `NQHeatmapChart`. */
export function prepareHeatmapCells(
  rowLabels: string[],
  colLabels: string[],
  values: number[][],
): { cells: HeatmapCell[]; min: number; max: number } {
  const cells: HeatmapCell[] = [];
  let min = Infinity;
  let max = -Infinity;

  for (let y = 0; y < rowLabels.length; y++) {
    for (let x = 0; x < colLabels.length; x++) {
      const value = values[y]?.[x] ?? 0;
      min = Math.min(min, value);
      max = Math.max(max, value);
      cells.push({
        row: rowLabels[y]!,
        col: colLabels[x]!,
        x,
        y,
        value,
      });
    }
  }

  if (cells.length === 0) {
    return { cells: [], min: 0, max: 0 };
  }

  return { cells, min, max };
}

export type BulletRow = {
  label: string;
  poor: number;
  satisfactory: number;
  good: number;
  actual: number;
  target: number;
  max: number;
};

/** One horizontal bullet row for `NQBarChart` with `layout="horizontal"`. */
export function prepareBulletRow(
  label: string,
  options: {
    actual: number;
    target: number;
    max?: number;
    poor?: number;
    satisfactory?: number;
    good?: number;
  },
): BulletRow {
  const max = options.max ?? 100;
  const poor = options.poor ?? max * 0.33;
  const satisfactory = options.satisfactory ?? max * 0.34;
  const good = options.good ?? Math.max(0, max - poor - satisfactory);

  return {
    label,
    poor,
    satisfactory,
    good,
    actual: options.actual,
    target: options.target,
    max,
  };
}

/** Map a KPI value into 0–100 for semi radial gauges. */
export function normalizeGaugeValue(value: number, min = 0, max = 100) {
  const span = Math.max(max - min, 1);
  return Math.min(100, Math.max(0, ((value - min) / span) * 100));
}

export type GaugeSeriesRow = {
  series: string;
  value: number;
};

/**
 * Rows for multi-metric **semi radial bar** comparisons (one concentric ring per key).
 * For a KPI **dial with target needle**, use a single row and `<RadialBar target={…} />`.
 * Each `series` key must match a `chartConfig` entry; use `nameKey="series"`.
 */
export function prepareGaugeRows(metrics: Record<string, number>): GaugeSeriesRow[] {
  return Object.entries(metrics).map(([series, value]) => ({ series, value }));
}

export type BoxPlotRow = {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
};

/** Summarize numeric samples into quartiles for box plot recipes on `NQComposedChart`. */
export function prepareBoxPlotRow(category: string, samples: number[]): BoxPlotRow {
  if (samples.length === 0) {
    return { category, min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const quantile = (p: number) => {
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower]!;
    const weight = index - lower;
    return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
  };

  return {
    category,
    min: sorted[0]!,
    q1: quantile(0.25),
    median: quantile(0.5),
    q3: quantile(0.75),
    max: sorted[sorted.length - 1]!,
  };
}

const toFiniteNumber = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

export type VarianceRow = {
  category: string;
  actual: number | null;
  plan: number | null;
  /** `actual − plan`; null when either side is missing. */
  delta: number | null;
  /** `delta ÷ |plan| × 100` (1 decimal); null when plan is missing or 0. */
  deltaPct: number | null;
  /** Favourable variance (`delta ≥ 0` when `higherIsBetter`, `delta ≤ 0` otherwise); null when no delta. */
  good: boolean | null;
};

/**
 * IBCS-style actual vs plan: one row per category with Δ, Δ% and a good / bad flag.
 * Split `delta` into two series (favourable / unfavourable) in the example so colours follow config.
 */
export function prepareVarianceRows<TData extends Record<string, unknown>>(
  rows: TData[],
  options: {
    categoryKey: string;
    actualKey: string;
    planKey: string;
    /** Set `false` for cost-like measures where under plan is good. Default `true`. */
    higherIsBetter?: boolean;
  },
): VarianceRow[] {
  const higherIsBetter = options.higherIsBetter ?? true;
  return rows.map((row) => {
    const actual = toFiniteNumber(row[options.actualKey]);
    const plan = toFiniteNumber(row[options.planKey]);
    const delta = actual != null && plan != null ? actual - plan : null;
    return {
      category: String(row[options.categoryKey] ?? ""),
      actual,
      plan,
      delta,
      deltaPct: delta != null && plan != null && plan !== 0 ? round1((delta / Math.abs(plan)) * 100) : null,
      good: delta == null ? null : higherIsBetter ? delta >= 0 : delta <= 0,
    };
  });
}

export type CohortCell = HeatmapCell;

/**
 * Cohort retention triangle for `NQHeatmapChart`.
 * Long rows (`cohort`, `period`, `value`) become cells; period 0 is the base (100% in `percent` mode).
 * Cohorts sort ascending (numeric-aware, so `2026-01` precedes `2026-02`); future periods a cohort has not
 * reached are omitted, never zero. In `percent` mode a cohort without a positive period 0 is dropped.
 * `yLabels` are oldest first — pass them reversed to the heatmap to put the oldest cohort at the top.
 */
export function prepareCohortCells<TData extends Record<string, unknown>>(
  rows: TData[],
  options: {
    cohortKey: string;
    periodKey: string;
    valueKey: string;
    mode?: "percent" | "absolute";
  },
): { cells: CohortCell[]; xLabels: string[]; yLabels: string[]; min: number; max: number } {
  const mode = options.mode ?? "percent";
  const byCohort = new Map<string, Map<number, number>>();
  let maxPeriod = -1;

  for (const row of rows) {
    const cohort = String(row[options.cohortKey] ?? "");
    const period = toFiniteNumber(row[options.periodKey]);
    const value = toFiniteNumber(row[options.valueKey]);
    if (period == null || value == null || period < 0 || !Number.isInteger(period)) continue;
    const periods = byCohort.get(cohort) ?? new Map<number, number>();
    periods.set(period, value);
    byCohort.set(cohort, periods);
    maxPeriod = Math.max(maxPeriod, period);
  }

  const cohorts = [...byCohort.keys()]
    .filter((cohort) => mode === "absolute" || (byCohort.get(cohort)!.get(0) ?? 0) > 0)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const xLabels = Array.from({ length: maxPeriod + 1 }, (_, p) => `M${p}`);

  const cells: CohortCell[] = [];
  cohorts.forEach((cohort, y) => {
    const periods = byCohort.get(cohort)!;
    const base = periods.get(0) ?? 0;
    for (const [period, value] of [...periods.entries()].sort((a, b) => a[0] - b[0])) {
      cells.push({
        row: cohort,
        col: `M${period}`,
        x: period,
        y,
        value: mode === "percent" ? round1((value / base) * 100) : value,
      });
    }
  });

  if (cells.length === 0) return { cells, xLabels: [], yLabels: [], min: 0, max: 0 };
  const values = cells.map((c) => c.value);
  return { cells, xLabels, yLabels: cohorts, min: Math.min(...values), max: Math.max(...values) };
}

export type ForecastRow = {
  /** Actual value up to and including the last actual point; null after. */
  actual: number | null;
  /** Starts at the last actual point (so the lines join), then the forecast; null before. */
  forecast: number | null;
  /** Band bounds (pinched to the actual at the join point); null outside the forecast. */
  lower: number | null;
  upper: number | null;
  /** `[lower, upper]`, or null outside the forecast. */
  band: [number, number] | null;
  [key: string]: unknown;
};

/**
 * Split a time series into actual + forecast + confidence band for line / composed charts.
 * The last row with a numeric `actualKey` is "today": the forecast line and band start there.
 * Original row fields are kept; `actual`, `forecast`, `lower`, `upper`, `band` are overwritten.
 * Use `<RangeArea lowKey="lower" highKey="upper" />` for the band.
 */
export function prepareForecastSeries<TData extends Record<string, unknown>>(
  rows: TData[],
  options: {
    dateKey: string;
    actualKey: string;
    forecastKey: string;
    lowerKey: string;
    upperKey: string;
  },
): Array<TData & ForecastRow> {
  let last = -1;
  rows.forEach((row, i) => {
    if (toFiniteNumber(row[options.actualKey]) != null) last = i;
  });

  return rows.map((row, i) => {
    const actualValue = toFiniteNumber(row[options.actualKey]);
    const actual = i <= last ? actualValue : null;
    let forecast: number | null = null;
    let lower: number | null = null;
    let upper: number | null = null;

    if (last >= 0 && i === last) {
      forecast = actualValue;
      lower = actualValue;
      upper = actualValue;
    } else if (i > last) {
      forecast = toFiniteNumber(row[options.forecastKey]);
      lower = toFiniteNumber(row[options.lowerKey]);
      upper = toFiniteNumber(row[options.upperKey]);
    }

    return {
      ...row,
      actual,
      forecast,
      lower,
      upper,
      band: lower != null && upper != null ? ([lower, upper] as [number, number]) : null,
    };
  });
}

export type DumbbellRow = {
  category: string;
  from: number;
  to: number;
  /** `to − from`. */
  delta: number;
  direction: "up" | "down" | "flat";
};

/** Before → after rows for a dumbbell / slope chart, sorted by `delta` descending (ties keep input order). */
export function prepareDumbbellRows<TData extends Record<string, unknown>>(
  rows: TData[],
  options: { categoryKey: string; fromKey: string; toKey: string },
): DumbbellRow[] {
  const out: DumbbellRow[] = [];
  for (const row of rows) {
    const from = toFiniteNumber(row[options.fromKey]);
    const to = toFiniteNumber(row[options.toKey]);
    if (from == null || to == null) continue;
    const delta = to - from;
    out.push({
      category: String(row[options.categoryKey] ?? ""),
      from,
      to,
      delta,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    });
  }
  return out.sort((a, b) => b.delta - a.delta);
}
