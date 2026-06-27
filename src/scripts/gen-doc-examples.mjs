import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src");
const index = readFileSync(path.join(root, "registry/__index__.tsx"), "utf8");
const indexed = new Set([...index.matchAll(/^\s+"([^"]+)":\s*\{/gm)].map((m) => m[1]));

function collectPreviewsSync() {
  const names = new Set();
  function walk(p) {
    for (const ent of readdirSync(p, { withFileTypes: true })) {
      const full = path.join(p, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith(".mdx")) {
        const text = readFileSync(full, "utf8");
        for (const m of text.matchAll(/name="(ex-[^"]+)"/g)) names.add(m[1]);
      }
    }
  }
  walk(path.join(root, "content/docs"));
  return names;
}

function toExportName(slug) {
  const base = slug.replace(/^ex-/, "");
  return (
    "BeeExample" +
    base
      .split("-")
      .map((s) => (s.match(/^\d/) ? s : s.charAt(0).toUpperCase() + s.slice(1)))
      .join("")
  );
}

function chartFamily(slug) {
  if (slug.includes("area-chart")) return "area";
  if (slug.includes("sankey-chart")) return "sankey";
  if (slug.includes("bubble-sized")) return "scatter-sized";
  if (slug.includes("bubble-chart")) return "scatter-bubble";
  if (slug.includes("scatter-chart")) return "scatter";
  if (slug.includes("radar-chart")) return "radar";
  if (slug.includes("sparkline-chart")) return "sparkline";
  if (slug.includes("treemap-chart")) return "treemap";
  if (slug.includes("waterfall-chart")) return "waterfall";
  if (slug.includes("funnel-chart")) return "funnel";
  if (slug.includes("gauge-chart")) return "radial-gauge";
  if (slug.includes("radial-chart")) return "radial";
  if (slug.includes("chart-config") || slug.includes("gradient-colors-bar")) return "bar";
  if (slug.includes("composed-chart")) return "composed";
  if (slug.includes("bar-chart")) return "bar";
  return "line-skip";
}

function variantFromSlug(slug, family) {
  const opts = { isLoading: slug.includes("loading-state"), glowing: slug.includes("glowing") };
  if (family === "area") {
    if (slug.includes("stacked-type")) opts.stackType = "stacked";
    else if (slug.includes("expanded-type")) opts.stackType = "percent";
    else opts.stackType = "default";
    if (slug.includes("step-curve")) opts.curveType = "step";
    else if (slug.includes("bump-curve") || slug.includes("monotoney")) opts.curveType = "bump";
    else opts.curveType = "monotone";
    if (slug.includes("dashed")) opts.areaVariant = "dashed-stroke";
    else if (slug.includes("hatched")) opts.areaVariant = "hatched";
    else if (slug.includes("dotted-area")) opts.areaVariant = "dotted";
    else if (slug.includes("lines-area")) opts.areaVariant = "lines";
    else if (slug.includes("solid-area")) opts.areaVariant = "solid";
    else opts.areaVariant = "gradient";
  }
  if (family === "radar") {
    if (slug.includes("lines-variant")) opts.radarVariant = "lines";
    if (slug.includes("circle-grid")) opts.gridVariant = "circle";
  }
  if (family === "radial") {
    opts.variant = slug.includes("semi-variant") ? "semi" : "full";
  }
  if (family === "sparkline" && slug.includes("bubbles")) opts.bgBubbles = true;
  return opts;
}

function renderComponent(family, opts, slug) {
  const v = opts.areaVariant ?? "gradient";
  const stack = opts.stackType ?? "stacked";
  const curve = opts.curveType ?? "monotone";
  switch (family) {
    case "area":
      return `<BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="${stack}"${opts.isLoading ? " isLoading" : ""}>
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="${opts.glowing ? "glowing" : v}" curveType="${curve}" />
      <Area dataKey="mobile" variant="${opts.glowing ? "glowing" : v}" curveType="${curve}" />
    </BeeAreaChart>`;
    case "sankey":
      return `<BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>`;
    case "scatter":
      return `<BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4"${opts.isLoading ? " isLoading" : ""}>
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="${opts.glowing ? "glowing" : "default"}" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </BeeScatterChart>`;
    case "scatter-bubble":
      return `<BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis /><YAxis /><ScatterLegend /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" /><Scatter dataKey="mobile" data={SCATTER_MOBILE} variant="bubble" />
    </BeeScatterChart>`;
    case "scatter-sized":
      return `<BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" />
    </BeeScatterChart>`;
    case "radar":
      return `<BeeRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4"${opts.isLoading ? " isLoading" : ""}>
      <PolarGrid variant="${opts.gridVariant ?? "polygon"}" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="${opts.glowing ? "glowing" : opts.radarVariant ?? "filled"}" /><Radar dataKey="mobile" variant="filled" />
    </BeeRadarChart>`;
    case "funnel":
      return `<BeeFunnelChart data={FUNNEL_DATA} config={FUNNEL_CONFIG} className="h-full w-full p-4"${opts.isLoading ? " isLoading" : ""}>
      <FunnelYAxis /><FunnelXAxis /><Stages /><FunnelLegend isClickable /><FunnelTooltip />
    </BeeFunnelChart>`;
    case "waterfall":
      return `<BeeWaterfallChart data={WATERFALL_DATA} config={WATERFALL_CONFIG} className="h-full w-full p-4"${opts.isLoading ? " isLoading" : ""}>
      <WfGrid /><WfXAxis /><WfYAxis /><Bars /><WfLegend /><WfTooltip />
    </BeeWaterfallChart>`;
    case "treemap":
      return `<BeeTreemapChart data={TREEMAP_DATA} config={TREEMAP_CONFIG} className="h-full w-full p-4"><Tiles /><TreemapTooltip /></BeeTreemapChart>`;
    case "sparkline":
      return `<BeeSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4"${opts.bgBubbles ? ' backgroundVariant="bubbles"' : ""}${opts.isLoading ? " isLoading" : ""}>
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </BeeSparklineChart>`;
    case "radial-gauge":
      return `<BeeRadialChart data={[{ series: "score", value: 72 }]} config={{ score: { label: "NPS", colors: { light: ["#3b82f6","#10b981"], dark: ["#60a5fa","#34d399"] } } }} nameKey="series" variant="semi" className="h-full w-full p-4"><RadialTooltip /><RadialBar dataKey="value" /></BeeRadialChart>`;
    case "radial":
      return `<BeeRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="${opts.variant ?? "full"}" className="h-full w-full p-4"><RadialLegend isClickable /><RadialTooltip /><RadialBar dataKey="visitors" /></BeeRadialChart>`;
    case "bar":
      return `<BeeBarChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month"${opts.isLoading ? " isLoading" : ""}>
      <BarGrid /><BarXAxis dataKey="month" tickFormatter={formatMonthTickShort} /><BarLegend /><BarTooltip />
      <Bar dataKey="desktop" /><Bar dataKey="mobile" />
    </BeeBarChart>`;
    default:
      return null;
  }
}

const all = collectPreviewsSync();
const missing = [...all].filter((n) => !indexed.has(n) && chartFamily(n) !== "line-skip");

let tsx = `"use client";\n\n`;
tsx += `import { BeeAreaChart, Area, XAxis, Grid, Legend, Tooltip } from "@/registry/charts/area-chart";\n`;
tsx += `import { BeeBarChart, Bar, XAxis as BarXAxis, Grid as BarGrid, Legend as BarLegend, Tooltip as BarTooltip } from "@/registry/charts/bar-chart";\n`;
tsx += `import { BeeSankeyChart, Tooltip as SankeyTooltip } from "@/registry/charts/sankey-chart";\n`;
tsx += `import { BeeScatterChart, Scatter, XAxis as ScatterXAxis, YAxis, Grid as ScatterGrid, Legend as ScatterLegend, Tooltip as ScatterTooltip } from "@/registry/charts/scatter-chart";\n`;
tsx += `import { BeeRadarChart, Radar, PolarGrid, PolarAngleAxis, Legend as RadarLegend, Tooltip as RadarTooltip } from "@/registry/charts/radar-chart";\n`;
tsx += `import { BeeFunnelChart, Stages, XAxis as FunnelXAxis, YAxis as FunnelYAxis, Legend as FunnelLegend, Tooltip as FunnelTooltip } from "@/registry/charts/funnel-chart";\n`;
tsx += `import { BeeWaterfallChart, Bars, Grid as WfGrid, XAxis as WfXAxis, YAxis as WfYAxis, Legend as WfLegend, Tooltip as WfTooltip } from "@/registry/charts/waterfall-chart";\n`;
tsx += `import { BeeTreemapChart, Tiles, Tooltip as TreemapTooltip } from "@/registry/charts/treemap-chart";\n`;
tsx += `import { BeeSparklineChart, Fill, Sparkline, Tooltip as SparkTooltip } from "@/registry/charts/sparkline-chart";\n`;
tsx += `import { BeeRadialChart, RadialBar, Tooltip as RadialTooltip, Legend as RadialLegend } from "@/registry/charts/radial-chart";\n`;
tsx += `import { formatMonthTickShort, TRAFFIC_MONTHLY_DATA, DUAL_SERIES_CHART_CONFIG } from "@/registry/examples/example-shared";\n`;
tsx += `import { SCATTER_DESKTOP, SCATTER_MOBILE, RADAR_SKILLS_DATA, SANKEY_MARKETING, SANKEY_CONFIG, FUNNEL_DATA, FUNNEL_CONFIG, WATERFALL_DATA, WATERFALL_CONFIG, TREEMAP_DATA, TREEMAP_CONFIG, SPARKLINE_DATA, SPARKLINE_CONFIG, BROWSER_DATA, BROWSER_CONFIG } from "@/registry/examples/example-datasets";\n\n`;

let registry = `import type { Registry } from "shadcn/schema";\n\nconst FILE = "examples/ex-doc-charts.tsx";\n\nfunction ex(name: string, exportName: string, deps: string[]) {\n  return { name, registryDependencies: deps, type: "registry:block" as const, files: [{ path: FILE, type: "registry:block" as const }], meta: { exportName } };\n}\n\nexport const docExamples: Registry["items"] = [\n`;

const depsMap = {
  area: ["@beecharts/area-chart"],
  sankey: ["@beecharts/sankey-chart"],
  scatter: ["@beecharts/scatter-chart"],
  "scatter-bubble": ["@beecharts/scatter-chart"],
  "scatter-sized": ["@beecharts/scatter-chart"],
  radar: ["@beecharts/radar-chart"],
  funnel: ["@beecharts/funnel-chart"],
  waterfall: ["@beecharts/waterfall-chart"],
  treemap: ["@beecharts/treemap-chart"],
  sparkline: ["@beecharts/sparkline-chart"],
  radial: ["@beecharts/radial-chart"],
  "radial-gauge": ["@beecharts/radial-chart"],
  bar: ["@beecharts/bar-chart"],
};

let count = 0;
for (const slug of missing.sort()) {
  const fam = chartFamily(slug);
  const opts = variantFromSlug(slug, fam);
  const body = renderComponent(fam, opts, slug);
  if (!body) continue;
  const exportName = toExportName(slug);
  tsx += `export function ${exportName}() {\n  return (\n    ${body}\n  );\n}\n\n`;
  registry += `  ex("${slug}", "${exportName}", ${JSON.stringify(depsMap[fam] ?? depsMap.bar)}),\n`;
  count++;
}

registry += `];\n`;

writeFileSync(path.join(root, "registry/examples/ex-doc-charts.tsx"), tsx);
writeFileSync(path.join(root, "registry/registry-doc-examples.ts"), registry);
console.log(`Generated ${count} doc examples (${missing.length} missing slugs)`);
