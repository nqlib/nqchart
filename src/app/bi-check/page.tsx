"use client";

/**
 * BI-readiness check — the manual half of plan 013, on one page.
 *
 * Every case here is something a BI consumer needs and 0.2.2 could not do. Open
 * `/bi-check`, work down the page, and read the result panel at the top: it records the last
 * mark click, the last legend selection and the last brush range, so "did it fire, and with
 * what?" is answerable without a console.
 *
 * Deliberately ugly. This is an instrument, not a demo — the showcase dashboard on `/` is
 * where the library is meant to look good.
 */

import { useRef, useState } from "react";

import {
  NQComposedChart,
  Bar,
  Line,
  Area,
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceBand,
} from "@/registry/charts/composed-chart";
import {
  NQLineChart,
  Line as SoloLine,
  Grid as LineGrid,
  XAxis as LineXAxis,
  YAxis as LineYAxis,
  Tooltip as LineTooltip,
} from "@/registry/charts/line-chart";
import { NQPieChart, Pie, Legend as PieLegend, Tooltip as PieTooltip } from "@/registry/charts/pie-chart";
import type { ChartHandle } from "@/registry/echarts-core/chart-handle";
import type { ChartBrushRange } from "@/registry/echarts-core/use-chart-brush";
import type { NQMarkEvent } from "@/registry/echarts-core/nq-mark-event";
import { type ChartConfig } from "@/registry/ui/chart";

type Row = {
  month: string;
  planned: number | null;
  actual: number | null;
  otd: number | null;
};

/** Two units on purpose — cost in USD, on-time delivery in percent. */
const DATA: Row[] = [
  { month: "2026-01", planned: 420_000, actual: 398_400, otd: 0.91 },
  { month: "2026-02", planned: 435_000, actual: 451_200, otd: 0.88 },
  { month: "2026-03", planned: 410_000, actual: 402_900, otd: 0.94 },
  { month: "2026-04", planned: 455_000, actual: 470_100, otd: 0.86 },
  // A genuine gap, not a zero: `actual` has not landed yet. It must draw as a gap.
  { month: "2026-05", planned: 460_000, actual: null, otd: 0.9 },
  { month: "2026-06", planned: 470_000, actual: 462_800, otd: 0.93 },
];

const CONFIG = {
  planned: { label: "Planned cost", colors: { light: ["#7c8fe8"], dark: ["#8DA0EE"] } },
  actual: { label: "Actual cost", colors: { light: ["#091f65"], dark: ["#c9d3ff"] } },
  otd: { label: "On-time delivery", colors: { light: ["#b26708"], dark: ["#e5a344"] } },
} satisfies ChartConfig;

const PIE_DATA = [
  { name: "Alpha", value: 40 },
  { name: "Beta", value: 35 },
  { name: "Gamma", value: 25 },
];

const PIE_CONFIG = {
  Alpha: { label: "Alpha", colors: { light: ["#7c8fe8"], dark: ["#8DA0EE"] } },
  Beta: { label: "Beta", colors: { light: ["#091f65"], dark: ["#c9d3ff"] } },
  Gamma: { label: "Gamma", colors: { light: ["#b26708"], dark: ["#e5a344"] } },
} satisfies ChartConfig;

const LOG_DATA = [
  { bucket: "a", v: 10 },
  { bucket: "b", v: 100 },
  { bucket: "c", v: 1_000 },
  { bucket: "d", v: 10_000 },
];

const LOG_CONFIG = {
  v: { label: "Magnitude", colors: { light: ["#091f65"], dark: ["#c9d3ff"] } },
} satisfies ChartConfig;

const usd = (v: unknown) =>
  typeof v === "number"
    ? `$${new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v)}`
    : String(v ?? "");

const pct = (v: unknown) =>
  typeof v === "number"
    ? new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 }).format(v)
    : String(v ?? "");

function formatClick(e: NQMarkEvent) {
  const mods = Object.entries(e.modifiers)
    .filter(([, on]) => on)
    .map(([k]) => k)
    .join("+");
  return `${e.seriesKey} @ ${String(e.category)} (i=${e.index})${mods ? ` [${mods}]` : ""}`;
}

export default function BiCheckPage() {
  const [lastClick, setLastClick] = useState<string>("— nothing yet —");
  const [selected, setSelected] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [brush, setBrush] = useState<string>("— nothing yet —");
  const [exportNote, setExportNote] = useState<string>("—");
  const chartRef = useRef<ChartHandle | null>(null);

  const onMarkClick = (e: NQMarkEvent) => {
    setClickCount((c) => c + 1);
    setLastClick(formatClick(e));
  };

  const onBrushChange = (range: ChartBrushRange) => {
    setBrush(`${range.startIndex}…${range.endIndex}`);
  };

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">BI-readiness check</h1>
        <p className="text-sm opacity-70">
          Plan 013 phase 3 + plan 015 harness. Work down the page; the panel below records what
          fired.
        </p>
      </header>

      <section className="rounded border p-4 font-mono text-xs space-y-1">
        <div>
          <b>last mark click:</b> {lastClick}
        </div>
        <div>
          <b>clicks fired:</b> {clickCount}
        </div>
        <div>
          <b>legend selection:</b> {selected ?? "(none)"}
        </div>
        <div>
          <b>brush range:</b> {brush}
        </div>
        <div>
          <b>export:</b> {exportNote}
        </div>
        <button
          type="button"
          className="mt-2 rounded border px-2 py-1"
          onClick={() => {
            const url = chartRef.current?.toDataURL();
            setExportNote(
              url
                ? `PNG ${url.startsWith("data:image/png") ? "ok" : "unexpected"} (${url.length} chars)`
                : "no handle",
            );
          }}
        >
          Export PNG via chartRef.toDataURL()
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">
          1 — Composed marks, two axes, two units, a gap, Area + Line
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-80">
          <li>Bars are cost (left axis, $). The line is on-time delivery (right axis, %).</li>
          <li>
            Area under OTD (same <code>yAxisId=&quot;right&quot;</code>) must render with the line —
            case 14.
          </li>
          <li>May has no actual — it must draw as a <b>gap</b>, never as zero.</li>
          <li>Click a bar: the panel above must show the raw category and the series key.</li>
          <li>Click empty plot background: nothing must fire (the counter must not move).</li>
          <li>Shift-click and Cmd-click: modifiers must be reported.</li>
          <li>Click a legend entry: it must isolate that series.</li>
          <li>Drag the brush: range must update in the panel.</li>
          <li>
            Reference line / band must draw, stay out of the legend, and not fire mark click.
          </li>
          <li>
            Tab to this plot, arrow keys, Enter — focus moves; Enter updates the panel (case 17).
          </li>
        </ul>

        <div className="rounded border p-4">
          <NQComposedChart
            config={CONFIG}
            data={DATA}
            xDataKey="month"
            className="h-80 w-full p-2"
            onMarkClick={onMarkClick}
            onBrushChange={onBrushChange}
            chartRef={chartRef}
          >
            <Grid />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" tickFormatter={usd} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={pct} />
            <Tooltip />
            <Legend isClickable selected={selected} onSelectChange={setSelected} />
            <ReferenceBand y={[400_000, 450_000]} yAxisId="left" tone="warning" />
            <ReferenceLine y={430_000} yAxisId="left" label="Budget" />
            <Bar dataKey="planned" yAxisId="left" />
            <Bar dataKey="actual" yAxisId="left" />
            <Area dataKey="otd" yAxisId="right" />
            <Line dataKey="otd" yAxisId="right" curveType="monotone" />
          </NQComposedChart>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">2 — Line mark click (case 6)</h2>
        <p className="text-sm opacity-80">
          Standalone line: click a point; hit area must be usable and update the panel.
        </p>
        <div className="rounded border p-4">
          <NQLineChart
            config={CONFIG}
            data={DATA}
            xDataKey="month"
            className="h-48 w-full p-2"
            onMarkClick={onMarkClick}
            showBrush={false}
          >
            <LineGrid />
            <LineXAxis dataKey="month" />
            <LineYAxis tickFormatter={pct} />
            <SoloLine dataKey="otd" curveType="monotone" />
            <LineTooltip />
          </NQLineChart>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">3 — yAxisId fallback (case 11)</h2>
        <p className="text-sm opacity-80">
          Only one <code>YAxis</code>, but series says <code>yAxisId=&quot;right&quot;</code> — must
          fall back to axis 0, not render empty.
        </p>
        <div className="rounded border p-4">
          <NQComposedChart
            config={CONFIG}
            data={DATA}
            xDataKey="month"
            className="h-40 w-full p-2"
            showBrush={false}
          >
            <Grid />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={usd} />
            <Bar dataKey="planned" yAxisId="right" />
            <Tooltip />
          </NQComposedChart>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">4 — Log scale (case 12)</h2>
        <p className="text-sm opacity-80">Wide positive range on <code>scale=&quot;log&quot;</code> — must render without crash.</p>
        <div className="rounded border p-4">
          <NQLineChart
            config={LOG_CONFIG}
            data={LOG_DATA}
            xDataKey="bucket"
            className="h-40 w-full p-2"
            showBrush={false}
          >
            <LineGrid />
            <LineXAxis dataKey="bucket" />
            <LineYAxis scale="log" />
            <SoloLine dataKey="v" />
            <LineTooltip />
          </NQLineChart>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">5 — Empty + error plates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded border p-4">
            <p className="mb-2 text-sm opacity-80">Empty data → &ldquo;no data&rdquo; plate</p>
            <NQComposedChart
              config={CONFIG}
              data={[]}
              xDataKey="month"
              className="h-40 w-full p-2"
            >
              <Grid />
              <XAxis dataKey="month" />
              <YAxis />
              <Bar dataKey="planned" />
            </NQComposedChart>
          </div>
          <div className="rounded border p-4">
            <p className="mb-2 text-sm opacity-80">error prop → distinct from empty</p>
            <NQComposedChart
              config={CONFIG}
              data={DATA}
              xDataKey="month"
              className="h-40 w-full p-2"
              error={<span className="text-sm text-red-600">Failed to load series</span>}
            >
              <Grid />
              <XAxis dataKey="month" />
              <YAxis />
              <Bar dataKey="planned" />
            </NQComposedChart>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">6 — Pie mark click</h2>
        <div className="rounded border p-4">
          <NQPieChart
            config={PIE_CONFIG}
            data={PIE_DATA}
            className="h-56 w-full p-2"
            onMarkClick={onMarkClick}
          >
            <Pie dataKey="value" nameKey="name" />
            <PieTooltip />
            <PieLegend />
          </NQPieChart>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">7 — Accessibility and theme</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-80">
          <li>
            Inspect the chart container: a visually hidden <code>&lt;table&gt;</code> must
            mirror the series, and the canvas must be <code>aria-hidden</code>.
          </li>
          <li>
            Tab to section 1&apos;s plot, then use arrow keys — focus must move between marks;
            Enter must update the panel.
          </li>
          <li>Toggle OS dark mode and confirm every colour above still reads.</li>
          <li>Turn on reduced motion and reload — no intro animation.</li>
        </ul>
      </section>

      <footer className="border-t pt-4 text-xs opacity-60">
        Full plan: <code>plans/013-bi-readiness-acceptance-test-plan.md</code> · leftovers{" "}
        <code>plans/015-bi-ship-leftovers.md</code>. Phase 1 is <code>pnpm run check:api</code>.
      </footer>
    </main>
  );
}
