# Demo dashboard pattern

The homepage **SaaS revenue dashboard** is the canonical multi-chart layout. Copy its structure when building product dashboards.

**Source files (repo):**

| File | Role |
|------|------|
| `src/components/landing/demo-dashboard.tsx` | Layout + chart composition |
| `src/components/landing/dashboard-data.ts` | Mock data + `ChartConfig` |
| `src/components/landing/demo-dashboard-lazy.tsx` | `next/dynamic` + skeleton (landing perf) |
| `src/registry/examples/chart-tokens.ts` | `chartConfigColor()` helpers |

---

## Layout recipe

```
Section header (title + period badge)
├── KPI row (4 cards, grid-cols-2 lg:grid-cols-4)
├── Growth section
│   ├── Area chart (lg:col-span-2) — MRR trend
│   └── Radial semi gauge — activation %
└── Movement section
    ├── Stacked bar (lg:col-span-2) — new logo + expansion MRR
    └── Pie donut — plan mix
```

Use a card shell with fixed body height (`h-80`, `h-72`) and `className="h-full w-full p-4"` on every chart root.

---

## Chart 1 — MRR area trend

```tsx
<NQAreaChart
  data={MRR_MONTHLY}
  config={MRR_CONFIG}
  xDataKey="month"
  className="h-full w-full p-4"
  brushFormatLabel={formatMonthTickShort}
>
  <Grid />
  <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
  <Tooltip />
  <Area dataKey="mrr" />
</NQAreaChart>
```

- Single series; config key `mrr` matches `dataKey`.
- `brushFormatLabel` shortens month labels in the zoom brush footer.
- No `showBrush={false}` here — brush is on by default for long ranges.

---

## Chart 2 — Activation gauge (radial semi)

```tsx
<NQRadialChart
  data={ACTIVATION_DATA}
  config={ACTIVATION_CONFIG}
  nameKey="series"
  variant="semi"
  className="h-full w-full p-4"
>
  <RadialTooltip />
  <RadialBar dataKey="value" />
</NQRadialChart>
```

- Data: `[{ series: "activation", value: 78 }]` — `nameKey` value must match config key `activation`.
- Two-stop gradient in `ACTIVATION_CONFIG` for arc fill.
- Values on 0–100 scale for honest gauge reading.

---

## Chart 3 — Net new MRR (stacked bar)

```tsx
<NQBarChart
  data={MRR_MONTHLY}
  config={MRR_COMPONENTS_CONFIG}
  xDataKey="month"
  stackType="stacked"
  barRadius={6}
  className="h-full w-full p-4"
>
  <Grid />
  <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
  <Legend />
  <Tooltip />
  <Bar dataKey="new" />
  <Bar dataKey="expansion" />
</NQBarChart>
```

- `MRR_COMPONENTS_CONFIG` keys (`new`, `expansion`) match row fields on `MRR_MONTHLY`.
- `stackType="stacked"` combines series per category; use `stackType="percent"` for 100% stacks.

---

## Chart 4 — Plan mix (pie donut)

```tsx
<NQPieChart
  data={PLAN_MIX}
  config={PLAN_MIX_CONFIG}
  nameKey="plan"
  className="h-full w-full p-4"
>
  <PieTooltip />
  <Pie dataKey="accounts" nameKey="plan" innerRadius="45%" />
</NQPieChart>
```

- Config keys (`starter`, `growth`, …) match `plan` field values.
- Use `chartConfigColor(0..4)` for theme-aligned slice colors.

---

## Data + config checklist

1. Define row types and mock arrays in a `dashboard-data.ts` module.
2. Build `ChartConfig` with `chartConfigColor()` — see [colors.md](./colors.md).
3. Export tick formatters (`formatMonthTickShort`) and KPI constants alongside data.
4. Keep numbers internally consistent (MRR movement reconciles with trend).

---

## Landing performance

Wrap the dashboard for below-the-fold lazy load:

```tsx
const DemoDashboard = dynamic(
  () => import("./demo-dashboard").then((m) => m.DemoDashboard),
  { ssr: false, loading: () => <DemoDashboardSkeleton /> },
);
```

Mount inside `<LazyMount>` on the landing page so charts do not block first paint.

---

## Related examples

| Goal | Block / doc |
|------|-------------|
| Monospace KPI + bars | `monospace-bar-chart` — `/docs/bar-chart/blocks` |
| Hover trace KPI + bars | `hover-trace-bar-chart` |
| Workload calendar + heatmap | `ex-workload-dashboard-chart` |
| Full primitive list | [examples.md](./examples.md) |
