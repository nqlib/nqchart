"use client";

import { BeeAreaChart, Area, XAxis, Grid, Legend, Tooltip } from "@/registry/charts/area-chart";
import { BeeBarChart, Bar, XAxis as BarXAxis, Grid as BarGrid, Legend as BarLegend, Tooltip as BarTooltip } from "@/registry/charts/bar-chart";
import { BeeSankeyChart, Tooltip as SankeyTooltip } from "@/registry/charts/sankey-chart";
import { BeeScatterChart, Scatter, XAxis as ScatterXAxis, YAxis, Grid as ScatterGrid, Legend as ScatterLegend, Tooltip as ScatterTooltip } from "@/registry/charts/scatter-chart";
import { BeeRadarChart, Radar, PolarGrid, PolarAngleAxis, Legend as RadarLegend, Tooltip as RadarTooltip } from "@/registry/charts/radar-chart";
import { BeeFunnelChart, Stages, XAxis as FunnelXAxis, YAxis as FunnelYAxis, Legend as FunnelLegend, Tooltip as FunnelTooltip } from "@/registry/charts/funnel-chart";
import { BeeWaterfallChart, Bars, Grid as WfGrid, XAxis as WfXAxis, YAxis as WfYAxis, Legend as WfLegend, Tooltip as WfTooltip } from "@/registry/charts/waterfall-chart";
import { BeeTreemapChart, Tiles, Tooltip as TreemapTooltip } from "@/registry/charts/treemap-chart";
import { BeeSparklineChart, Fill, Sparkline, Tooltip as SparkTooltip } from "@/registry/charts/sparkline-chart";
import { BeeRadialChart, RadialBar, Tooltip as RadialTooltip, Legend as RadialLegend } from "@/registry/charts/radial-chart";
import { formatMonthTickShort, TRAFFIC_MONTHLY_DATA, DUAL_SERIES_CHART_CONFIG } from "@/registry/examples/example-shared";
import { SCATTER_DESKTOP, SCATTER_MOBILE, RADAR_SKILLS_DATA, SANKEY_MARKETING, SANKEY_CONFIG, FUNNEL_DATA, FUNNEL_CONFIG, WATERFALL_DATA, WATERFALL_CONFIG, TREEMAP_DATA, TREEMAP_CONFIG, SPARKLINE_DATA, SPARKLINE_CONFIG, BROWSER_DATA, BROWSER_CONFIG, BROWSER_GRADIENT_CONFIG } from "@/registry/examples/example-datasets";

export function BeeExampleAnimatedDashedStrokeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="dashed-stroke" curveType="monotone" />
      <Area dataKey="mobile" variant="dashed-stroke" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleBgBubblesSparklineChart() {
  return (
    <BeeSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4" backgroundVariant="bubbles">
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </BeeSparklineChart>
  );
}

export function BeeExampleBubbleChart() {
  return (
    <BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis /><YAxis /><ScatterLegend /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" /><Scatter dataKey="mobile" data={SCATTER_MOBILE} variant="bubble" />
    </BeeScatterChart>
  );
}

export function BeeExampleBubbleSizedChart() {
  return (
    <BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" />
    </BeeScatterChart>
  );
}

export function BeeExampleBumpCurveTypeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="bump" />
      <Area dataKey="mobile" variant="gradient" curveType="bump" />
    </BeeAreaChart>
  );
}

export function BeeExampleChartConfigDefaultBarChart() {
  return (
    <BeeBarChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month">
      <BarGrid /><BarXAxis dataKey="month" tickFormatter={formatMonthTickShort} /><BarLegend /><BarTooltip />
      <Bar dataKey="desktop" /><Bar dataKey="mobile" />
    </BeeBarChart>
  );
}

export function BeeExampleChartConfigIconsBarChart() {
  return (
    <BeeBarChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month">
      <BarGrid /><BarXAxis dataKey="month" tickFormatter={formatMonthTickShort} /><BarLegend /><BarTooltip />
      <Bar dataKey="desktop" /><Bar dataKey="mobile" />
    </BeeBarChart>
  );
}

export function BeeExampleCircleGridRadarChart() {
  return (
    <BeeRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="circle" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="filled" /><Radar dataKey="mobile" variant="filled" />
    </BeeRadarChart>
  );
}

export function BeeExampleDashedStrokeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="dashed-stroke" curveType="monotone" />
      <Area dataKey="mobile" variant="dashed-stroke" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleDefaultTypeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleDottedAreaVariantAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="dotted" curveType="monotone" />
      <Area dataKey="mobile" variant="dotted" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleExpandedTypeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="percent">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleFunnelChart() {
  return (
    <BeeFunnelChart data={FUNNEL_DATA} config={FUNNEL_CONFIG} className="h-full w-full p-4">
      <FunnelYAxis /><FunnelXAxis /><Stages /><FunnelLegend isClickable /><FunnelTooltip />
    </BeeFunnelChart>
  );
}

export function BeeExampleGlowingBubbleChart() {
  return (
    <BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis /><YAxis /><ScatterLegend /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" /><Scatter dataKey="mobile" data={SCATTER_MOBILE} variant="bubble" />
    </BeeScatterChart>
  );
}

export function BeeExampleGlowingFunnelChart() {
  return (
    <BeeFunnelChart data={FUNNEL_DATA} config={FUNNEL_CONFIG} className="h-full w-full p-4">
      <FunnelYAxis /><FunnelXAxis /><Stages /><FunnelLegend isClickable /><FunnelTooltip />
    </BeeFunnelChart>
  );
}

export function BeeExampleGlowingRadarChart() {
  return (
    <BeeRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="glowing" /><Radar dataKey="mobile" variant="filled" />
    </BeeRadarChart>
  );
}

export function BeeExampleGlowingRadialChart() {
  return (
    <BeeRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="full" className="h-full w-full p-4">
      <RadialLegend isClickable />
      <RadialTooltip />
      <RadialBar dataKey="visitors" glowingBars={["chrome", "safari", "firefox"]} />
    </BeeRadialChart>
  );
}

export function BeeExampleGlowingSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleGlowingScatterChart() {
  return (
    <BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="glowing" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </BeeScatterChart>
  );
}

export function BeeExampleGlowingSparklineChart() {
  return (
    <BeeSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </BeeSparklineChart>
  );
}

export function BeeExampleGlowingTreemapChart() {
  return (
    <BeeTreemapChart data={TREEMAP_DATA} config={TREEMAP_CONFIG} className="h-full w-full p-4">
      <Tiles glowingTiles={["Frontend", "Sales"]} showLabels />
      <TreemapTooltip />
    </BeeTreemapChart>
  );
}

export function BeeExampleGlowingWaterfallChart() {
  return (
    <BeeWaterfallChart data={WATERFALL_DATA} config={WATERFALL_CONFIG} className="h-full w-full p-4">
      <WfGrid /><WfXAxis /><WfYAxis /><Bars /><WfLegend /><WfTooltip />
    </BeeWaterfallChart>
  );
}

export function BeeExampleGradientAreaVariantAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleGradientColorsAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleGradientColorsBarChart() {
  return (
    <BeeBarChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month">
      <BarGrid /><BarXAxis dataKey="month" tickFormatter={formatMonthTickShort} /><BarLegend /><BarTooltip />
      <Bar dataKey="desktop" /><Bar dataKey="mobile" />
    </BeeBarChart>
  );
}

export function BeeExampleGradientColorsBumpAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleGradientColorsRadarChart() {
  return (
    <BeeRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="filled" /><Radar dataKey="mobile" variant="filled" />
    </BeeRadarChart>
  );
}

export function BeeExampleGradientColorsRadialChart() {
  return (
    <BeeRadialChart data={BROWSER_DATA} config={BROWSER_GRADIENT_CONFIG} nameKey="browser" variant="full" className="h-full w-full p-4">
      <RadialLegend isClickable />
      <RadialTooltip />
      <RadialBar dataKey="visitors" />
    </BeeRadialChart>
  );
}

export function BeeExampleGradientColorsSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleGradientColorsScatterChart() {
  return (
    <BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="default" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </BeeScatterChart>
  );
}

export function BeeExampleGradientReverseAreaVariantAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleHatchedAreaVariantAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="hatched" curveType="monotone" />
      <Area dataKey="mobile" variant="hatched" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleLabeledNodesSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleLinesAreaVariantAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="lines" curveType="monotone" />
      <Area dataKey="mobile" variant="lines" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleLinesVariantRadarChart() {
  return (
    <BeeRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="lines" /><Radar dataKey="mobile" variant="filled" />
    </BeeRadarChart>
  );
}

export function BeeExampleLoadingStateAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default" isLoading>
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleLoadingStateBubbleChart() {
  return (
    <BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" isLoading>
      <ScatterGrid /><ScatterXAxis /><YAxis /><ScatterLegend /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" /><Scatter dataKey="mobile" data={SCATTER_MOBILE} variant="bubble" />
    </BeeScatterChart>
  );
}

export function BeeExampleLoadingStateFunnelChart() {
  return (
    <BeeFunnelChart data={FUNNEL_DATA} config={FUNNEL_CONFIG} className="h-full w-full p-4" isLoading>
      <FunnelYAxis /><FunnelXAxis /><Stages /><FunnelLegend isClickable /><FunnelTooltip />
    </BeeFunnelChart>
  );
}

export function BeeExampleLoadingStateGaugeChart() {
  return (
    <BeeRadialChart data={[{ series: "score", value: 72 }]} config={{ score: { label: "NPS", colors: { light: ["#3b82f6","#10b981"], dark: ["#60a5fa","#34d399"] } } }} nameKey="series" variant="semi" className="h-full w-full p-4" isLoading><RadialTooltip /><RadialBar dataKey="value" /></BeeRadialChart>
  );
}

export function BeeExampleLoadingStateRadarChart() {
  return (
    <BeeRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" isLoading>
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="filled" /><Radar dataKey="mobile" variant="filled" />
    </BeeRadarChart>
  );
}

export function BeeExampleLoadingStateRadialChart() {
  return (
    <BeeRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="full" className="h-full w-full p-4" isLoading><RadialLegend isClickable /><RadialTooltip /><RadialBar dataKey="visitors" /></BeeRadialChart>
  );
}

export function BeeExampleLoadingStateSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4" isLoading><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleLoadingStateScatterChart() {
  return (
    <BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" isLoading>
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="default" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </BeeScatterChart>
  );
}

export function BeeExampleLoadingStateSparklineChart() {
  return (
    <BeeSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4" isLoading>
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </BeeSparklineChart>
  );
}

export function BeeExampleLoadingStateTreemapChart() {
  return (
    <BeeTreemapChart data={TREEMAP_DATA} config={TREEMAP_CONFIG} className="h-full w-full p-4" isLoading><Tiles /><TreemapTooltip /></BeeTreemapChart>
  );
}

export function BeeExampleLoadingStateWaterfallChart() {
  return (
    <BeeWaterfallChart data={WATERFALL_DATA} config={WATERFALL_CONFIG} className="h-full w-full p-4" isLoading>
      <WfGrid /><WfXAxis /><WfYAxis /><Bars /><WfLegend /><WfTooltip />
    </BeeWaterfallChart>
  );
}

export function BeeExampleMonotoneyCurveTypeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="bump" />
      <Area dataKey="mobile" variant="gradient" curveType="bump" />
    </BeeAreaChart>
  );
}

export function BeeExampleOutsideLabelsSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleRadarChart() {
  return (
    <BeeRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="filled" /><Radar dataKey="mobile" variant="filled" />
    </BeeRadarChart>
  );
}

export function BeeExampleRadialChart() {
  return (
    <BeeRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="full" className="h-full w-full p-4"><RadialLegend isClickable /><RadialTooltip /><RadialBar dataKey="visitors" /></BeeRadialChart>
  );
}

export function BeeExampleSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleScatterChart() {
  return (
    <BeeScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="default" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </BeeScatterChart>
  );
}

export function BeeExampleSemiVariantRadialChart() {
  return (
    <BeeRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="semi" className="h-full w-full p-4"><RadialLegend isClickable /><RadialTooltip /><RadialBar dataKey="visitors" /></BeeRadialChart>
  );
}

export function BeeExampleRoseRadialChart() {
  return (
    <BeeRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="full" layout="rose" className="h-full w-full p-4">
      <RadialLegend isClickable />
      <RadialTooltip />
      <RadialBar dataKey="visitors" />
    </BeeRadialChart>
  );
}

export function BeeExampleSolidAreaVariantAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="solid" curveType="monotone" />
      <Area dataKey="mobile" variant="solid" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleSolidLabeledNodesSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleSolidLinkVariantSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleSolidStrokeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleSourceLinkVariantSankeyChart() {
  return (
    <BeeSankeyChart data={SANKEY_MARKETING} config={SANKEY_CONFIG} className="h-full w-full p-4"><SankeyTooltip /></BeeSankeyChart>
  );
}

export function BeeExampleSparklineAreaChart() {
  return (
    <BeeSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Fill dataKey="trend" />
      <Sparkline dataKey="trend" />
      <SparkTooltip />
    </BeeSparklineChart>
  );
}

export function BeeExampleSparklineChart() {
  return (
    <BeeSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </BeeSparklineChart>
  );
}

export function BeeExampleStackedTypeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="stacked">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </BeeAreaChart>
  );
}

export function BeeExampleStepCurveTypeAreaChart() {
  return (
    <BeeAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="step" />
      <Area dataKey="mobile" variant="gradient" curveType="step" />
    </BeeAreaChart>
  );
}

export function BeeExampleTreemapChart() {
  return (
    <BeeTreemapChart data={TREEMAP_DATA} config={TREEMAP_CONFIG} className="h-full w-full p-4"><Tiles /><TreemapTooltip /></BeeTreemapChart>
  );
}

export function BeeExampleWaterfallChart() {
  return (
    <BeeWaterfallChart data={WATERFALL_DATA} config={WATERFALL_CONFIG} className="h-full w-full p-4">
      <WfGrid /><WfXAxis /><WfYAxis /><Bars /><WfLegend /><WfTooltip />
    </BeeWaterfallChart>
  );
}

export function BeeExampleSparklineEndDotChart() {
  return (
    <BeeSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Sparkline dataKey="trend" />
      <SparkTooltip />
    </BeeSparklineChart>
  );
}

export function BeeExampleSparklineReferenceBandChart() {
  return (
    <BeeSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Fill dataKey="trend" />
      <Sparkline dataKey="trend" />
      <SparkTooltip />
    </BeeSparklineChart>
  );
}

