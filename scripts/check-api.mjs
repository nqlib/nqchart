#!/usr/bin/env node
/**
 * Type-probe the published API surface (dist/types/), not src/.
 *
 * Compiles a small TSX file that passes every documented interaction prop to
 * every root that must accept it. Fails if a props type silently drops an
 * inherited factory prop (the 014 regression class).
 *
 * Requires: pnpm run build:types (or build:npm) first.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const typesRoot = join(root, "dist", "types");
const probeDir = join(root, ".api-probe");

const required = [
  "registry/charts/bar-chart.d.ts",
  "registry/charts/line-chart.d.ts",
  "registry/charts/area-chart.d.ts",
  "registry/charts/composed-chart.d.ts",
  "registry/charts/pie-chart.d.ts",
  "registry/charts/scatter-chart.d.ts",
  "registry/charts/waterfall-chart.d.ts",
  "registry/charts/funnel-chart.d.ts",
  "registry/echarts-core/nq-mark-event.d.ts",
  "registry/echarts-core/chart-handle.d.ts",
  "registry/echarts-core/use-chart-brush.d.ts",
];

if (!existsSync(typesRoot)) {
  console.error("check:api — missing dist/types/. Run build:types / build:npm first.");
  process.exit(1);
}

const missing = required.filter((f) => !existsSync(join(typesRoot, f)));
if (missing.length) {
  console.error(`check:api — missing declarations:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}

const probeTsx = `import { NQBarChart, Bar } from "../dist/types/registry/charts/bar-chart";
import { NQLineChart, Line } from "../dist/types/registry/charts/line-chart";
import { NQAreaChart, Area } from "../dist/types/registry/charts/area-chart";
import { NQComposedChart, Bar as CBar } from "../dist/types/registry/charts/composed-chart";
import { NQPieChart, Pie } from "../dist/types/registry/charts/pie-chart";
import { NQScatterChart, Scatter } from "../dist/types/registry/charts/scatter-chart";
import { NQWaterfallChart } from "../dist/types/registry/charts/waterfall-chart";
import { NQFunnelChart } from "../dist/types/registry/charts/funnel-chart";
import type { NQMarkEvent } from "../dist/types/registry/echarts-core/nq-mark-event";
import type { ChartHandle } from "../dist/types/registry/echarts-core/chart-handle";
import type { ChartBrushRange } from "../dist/types/registry/echarts-core/use-chart-brush";
import type { EChartsType } from "echarts/core";
import type { Ref } from "react";

const data = [{ x: "Jan", v: 1, y: 2 }];
const config = { v: { label: "V" } };
const pieData = [{ name: "A", value: 1 }];
const pieConfig = { A: { label: "A" } };
const scatterConfig = { points: { label: "Points" } };
const waterfallData = [{ name: "Start", value: 10, type: "start" }];
const waterfallConfig = { Start: { label: "Start" }, value: { label: "Value" } };
const funnelData = [{ stage: "A", value: 10 }];
const funnelConfig = { A: { label: "A" } };

const onMarkClick = (_e: NQMarkEvent) => {};
const onBrushChange = (_r: ChartBrushRange) => {};
const onChartReady = (_i: EChartsType) => {};
const chartRef = null as unknown as Ref<ChartHandle | null>;

export const bar = (
  <NQBarChart
    config={config}
    data={data}
    xDataKey="x"
    onMarkClick={onMarkClick}
    onBrushChange={onBrushChange}
    onChartReady={onChartReady}
    chartRef={chartRef}
  >
    <Bar dataKey="v" />
  </NQBarChart>
);

export const line = (
  <NQLineChart
    config={config}
    data={data}
    xDataKey="x"
    onMarkClick={onMarkClick}
    onBrushChange={onBrushChange}
    onChartReady={onChartReady}
    chartRef={chartRef}
  >
    <Line dataKey="v" />
  </NQLineChart>
);

export const area = (
  <NQAreaChart
    config={config}
    data={data}
    xDataKey="x"
    onMarkClick={onMarkClick}
    onBrushChange={onBrushChange}
    onChartReady={onChartReady}
    chartRef={chartRef}
  >
    <Area dataKey="v" />
  </NQAreaChart>
);

export const composed = (
  <NQComposedChart
    config={config}
    data={data}
    xDataKey="x"
    onMarkClick={onMarkClick}
    onBrushChange={onBrushChange}
    onChartReady={onChartReady}
    chartRef={chartRef}
  >
    <CBar dataKey="v" />
  </NQComposedChart>
);

export const pie = (
  <NQPieChart
    config={pieConfig}
    data={pieData}
    onMarkClick={onMarkClick}
    onChartReady={onChartReady}
    chartRef={chartRef}
  >
    <Pie dataKey="value" nameKey="name" />
  </NQPieChart>
);

export const scatter = (
  <NQScatterChart
    config={scatterConfig}
    onMarkClick={onMarkClick}
    onChartReady={onChartReady}
    chartRef={chartRef}
  >
    <Scatter dataKey="points" data={[{ x: 1, y: 2 }]} />
  </NQScatterChart>
);

export const waterfall = (
  <NQWaterfallChart
    config={waterfallConfig}
    data={waterfallData}
    onBrushChange={onBrushChange}
    onMarkClick={onMarkClick}
    onChartReady={onChartReady}
    chartRef={chartRef}
  >
    {null}
  </NQWaterfallChart>
);

export const funnel = (
  <NQFunnelChart
    config={funnelConfig}
    data={funnelData}
    onMarkClick={onMarkClick}
    onChartReady={onChartReady}
    chartRef={chartRef}
  >
    {null}
  </NQFunnelChart>
);
`;

rmSync(probeDir, { recursive: true, force: true });
mkdirSync(probeDir, { recursive: true });
writeFileSync(join(probeDir, "probe.tsx"), probeTsx, "utf8");

const result = spawnSync(
  "npx",
  [
    "tsc",
    "--noEmit",
    "--jsx",
    "react-jsx",
    "--esModuleInterop",
    "--skipLibCheck",
    "--moduleResolution",
    "bundler",
    "--module",
    "esnext",
    "--target",
    "es2020",
    "--types",
    "react",
    join(probeDir, "probe.tsx"),
  ],
  {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  },
);

rmSync(probeDir, { recursive: true, force: true });

if (result.status !== 0) {
  console.error("check:api — type probe failed:\n");
  if (result.stdout) process.stderr.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

console.info("check:api — ok (interaction props accepted on bar/line/area/composed/pie/scatter/waterfall/funnel)");
