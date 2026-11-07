# Data recipes (`@nqlib/nqchart/recipes`)

Pure data-prep helpers (no React) shipped in the package — no separate install. Import from the `recipes` subpath:

```ts
import { binForHistogram, prepareParetoData, prepareGaugeRows } from "@nqlib/nqchart/recipes";
```

Docs: `/docs/chart-recipes`.

---

## Histogram → `NQBarChart`

```ts
const data = binForHistogram(values, 8);
// { bin, count }[]
```

**Example:** `ex-histogram-chart` — [bar-chart doc](/docs/bar-chart)

---

## Bullet → `NQBarChart`

```ts
const data = [prepareBulletRow("Revenue", { actual: 72, target: 80, max: 100 })];
```

Use `layout="horizontal"`, `stackType="stacked"` for range bands, then `actual` and `target` bars.

**Example:** `ex-bullet-chart`

---

## Pareto → `NQComposedChart`

```ts
const data = prepareParetoData(rows, "cause", "count");
// adds count + cumulative (0–100)
```

Dual `YAxis` + `<Bar dataKey="count" />` + `<Line dataKey="cumulative" />`.

**Example:** `ex-pareto-chart`

---

## Box plot → `NQComposedChart`

```ts
const row = prepareBoxPlotRow("Team A", samples);
const data = [row].map((r) => ({
  ...r,
  iqrFloor: r.q1,
  iqr: Math.max(r.q3 - r.q1, 1),
}));
```

Stack `<Bar dataKey="iqrFloor" showInLegend={false} />` + `<Bar dataKey="iqr" />` + `<Whiskers minKey q1Key q3Key maxKey />` + `<Line dataKey="median" variant="points" />` — see `ex-boxplot-chart`.

---

## Analyst recipes (plan 021)

```ts
prepareVarianceRows(rows, { categoryKey, actualKey, planKey, higherIsBetter }); // actual, plan, delta, deltaPct, good
prepareCohortCells(rows, { cohortKey, periodKey, valueKey, mode: "percent" });  // { cells, xLabels M0…Mn, yLabels, min, max }
prepareForecastSeries(rows, { dateKey, actualKey, forecastKey, lowerKey, upperKey }); // actual, forecast, lower, upper, band
prepareDumbbellRows(rows, { categoryKey, fromKey, toKey });                    // from, to, delta, direction (sorted by delta)
```

- Variance → composed: two stacked `<Bar>` (`favorable` / `unfavorable`, one `stackId`) + `<ReferenceLine y={0} />` — `ex-variance-chart`.
- Cohort → `<Heatmap>`; pass `yLabels` reversed for oldest on top — `ex-cohort-retention-chart`.
- Forecast → composed: `<Line>` actual, `<Line variant="dashed">` forecast, `<RangeArea lowKey="lower" highKey="upper">`, `<ReferenceLine x="…" label="Today">` — `ex-forecast-chart`.
- Dumbbell → composed: `<Connector fromKey toKey>` + two `<Line variant="dots">` (vertical) — `ex-dumbbell-chart`.

---

## Heatmap → `NQHeatmapChart`

```ts
const { cells, min, max } = prepareHeatmapCells(rowLabels, colLabels, matrix);
```

```tsx
<NQHeatmapChart config={chartConfig} className="h-full w-full p-4">
  <Heatmap dataKey="intensity" data={cells} xLabels={colLabels} yLabels={rowLabels} min={min} max={max} />
  <Tooltip />
  <Legend />
</NQHeatmapChart>
```

Use a multi-stop color ramp on one config key (low → high intensity).

**Examples:** `ex-heatmap-chart`, `ex-heatmap-weekly-chart`, `ex-heatmap-correlation-chart`

---

## Calendar workload → `NQCalendarChart`

```ts
const { cells, min, max, range } = prepareCalendarWorkloadCells(workloadDays);
```

```tsx
<NQCalendarChart config={chartConfig} className="h-full w-full p-4">
  <Calendar dataKey="utilization" data={cells} range={range} min={min} max={max} />
  <Tooltip />
</NQCalendarChart>
```

**Examples:** `ex-calendar-workload-chart`, `ex-workload-dashboard-chart`

---

## Gauge → `NQRadialChart`

`nameKey` values must match `chartConfig` keys (use `series`, not a free-form label).

```ts
const data = [{ series: "score", value: normalizeGaugeValue(72, 0, 100) }];
// chartConfig.score, nameKey="series", <RadialBar dataKey="value" />

const withTarget = prepareGaugeRows({ score: 72, target: 80 });
// chartConfig.score + chartConfig.target
```

`variant="semi"`, `<RadialBar dataKey="value" />`.

**Examples:** `ex-gauge-chart`, `ex-gauge-with-target-chart`

---

## Bubble (sized) → `NQScatterChart`

Add a `size` field per point; use `scatterProps.shape` to scale radius.

**Examples:** `ex-bubble-chart`, `ex-bubble-sized-chart`

---

## When not to add a chart module

Histogram, Pareto, bullet, heatmap, gauge, and box plot stay **recipes** on existing primitives unless geometry is truly custom (waterfall, funnel, sparkline tier).
