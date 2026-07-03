"use client";

import { NQAreaChart, Area, XAxis, Grid, Legend, Tooltip } from "@/registry/charts/area-chart";
import { NQBarChart, Bar, XAxis as BarXAxis, Grid as BarGrid, Legend as BarLegend, Tooltip as BarTooltip } from "@/registry/charts/bar-chart";
import { NQScatterChart, Scatter, XAxis as ScatterXAxis, YAxis, Grid as ScatterGrid, Legend as ScatterLegend, Tooltip as ScatterTooltip } from "@/registry/charts/scatter-chart";
import { NQRadarChart, Radar, PolarGrid, PolarAngleAxis, Legend as RadarLegend, Tooltip as RadarTooltip } from "@/registry/charts/radar-chart";
import { NQFunnelChart, Stages, XAxis as FunnelXAxis, YAxis as FunnelYAxis, Legend as FunnelLegend, Tooltip as FunnelTooltip } from "@/registry/charts/funnel-chart";
import { NQWaterfallChart, Bars, Grid as WfGrid, XAxis as WfXAxis, YAxis as WfYAxis, Legend as WfLegend, Tooltip as WfTooltip } from "@/registry/charts/waterfall-chart";
import { NQTreemapChart, Tiles, Tooltip as TreemapTooltip } from "@/registry/charts/treemap-chart";
import { NQSparklineChart, Fill, Sparkline, Tooltip as SparkTooltip } from "@/registry/charts/sparkline-chart";
import { NQRadialChart, RadialBar, Tooltip as RadialTooltip, Legend as RadialLegend } from "@/registry/charts/radial-chart";
import { formatMonthTickShort, TRAFFIC_MONTHLY_DATA, DUAL_SERIES_CHART_CONFIG } from "@/registry/examples/example-shared";
import { SCATTER_DESKTOP, SCATTER_MOBILE, RADAR_SKILLS_DATA, FUNNEL_DATA, FUNNEL_CONFIG, WATERFALL_DATA, WATERFALL_CONFIG, TREEMAP_DATA, TREEMAP_CONFIG, SPARKLINE_DATA, SPARKLINE_CONFIG, BROWSER_DATA, BROWSER_CONFIG, BROWSER_GRADIENT_CONFIG } from "@/registry/examples/example-datasets";

export function NQExampleAnimatedDashedStrokeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="dashed-stroke" curveType="monotone" />
      <Area dataKey="mobile" variant="dashed-stroke" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleBgBubblesSparklineChart() {
  return (
    <NQSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4" backgroundVariant="bubbles">
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </NQSparklineChart>
  );
}

export function NQExampleBubbleChart() {
  return (
    <NQScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis /><YAxis /><ScatterLegend /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" /><Scatter dataKey="mobile" data={SCATTER_MOBILE} variant="bubble" />
    </NQScatterChart>
  );
}

export function NQExampleBubbleSizedChart() {
  return (
    <NQScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" />
    </NQScatterChart>
  );
}

export function NQExampleBumpCurveTypeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="bump" />
      <Area dataKey="mobile" variant="gradient" curveType="bump" />
    </NQAreaChart>
  );
}

export function NQExampleChartConfigDefaultBarChart() {
  return (
    <NQBarChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month">
      <BarGrid /><BarXAxis dataKey="month" tickFormatter={formatMonthTickShort} /><BarLegend /><BarTooltip />
      <Bar dataKey="desktop" /><Bar dataKey="mobile" />
    </NQBarChart>
  );
}

export function NQExampleChartConfigIconsBarChart() {
  return (
    <NQBarChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month">
      <BarGrid /><BarXAxis dataKey="month" tickFormatter={formatMonthTickShort} /><BarLegend /><BarTooltip />
      <Bar dataKey="desktop" /><Bar dataKey="mobile" />
    </NQBarChart>
  );
}

export function NQExampleCircleGridRadarChart() {
  return (
    <NQRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="circle" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="filled" /><Radar dataKey="mobile" variant="filled" />
    </NQRadarChart>
  );
}

export function NQExampleDashedStrokeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="dashed-stroke" curveType="monotone" />
      <Area dataKey="mobile" variant="dashed-stroke" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleDefaultTypeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleDottedAreaVariantAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="dotted" curveType="monotone" />
      <Area dataKey="mobile" variant="dotted" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleExpandedTypeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="percent">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleFunnelChart() {
  return (
    <NQFunnelChart data={FUNNEL_DATA} config={FUNNEL_CONFIG} className="h-full w-full p-4">
      <FunnelYAxis /><FunnelXAxis /><Stages /><FunnelLegend isClickable /><FunnelTooltip />
    </NQFunnelChart>
  );
}

export function NQExampleGlowingBubbleChart() {
  return (
    <NQScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis /><YAxis /><ScatterLegend /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" /><Scatter dataKey="mobile" data={SCATTER_MOBILE} variant="bubble" />
    </NQScatterChart>
  );
}

export function NQExampleGlowingFunnelChart() {
  return (
    <NQFunnelChart data={FUNNEL_DATA} config={FUNNEL_CONFIG} className="h-full w-full p-4">
      <FunnelYAxis /><FunnelXAxis /><Stages /><FunnelLegend isClickable /><FunnelTooltip />
    </NQFunnelChart>
  );
}

export function NQExampleGlowingRadarChart() {
  return (
    <NQRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="glowing" /><Radar dataKey="mobile" variant="filled" />
    </NQRadarChart>
  );
}

export function NQExampleGlowingRadialChart() {
  return (
    <NQRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="full" className="h-full w-full p-4">
      <RadialLegend isClickable />
      <RadialTooltip />
      <RadialBar dataKey="visitors" glowingBars={["chrome", "safari", "firefox"]} />
    </NQRadialChart>
  );
}


export function NQExampleGlowingScatterChart() {
  return (
    <NQScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="glowing" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </NQScatterChart>
  );
}

export function NQExampleGlowingSparklineChart() {
  return (
    <NQSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </NQSparklineChart>
  );
}

export function NQExampleGlowingTreemapChart() {
  return (
    <NQTreemapChart data={TREEMAP_DATA} config={TREEMAP_CONFIG} className="h-full w-full p-4">
      <Tiles glowingTiles={["Frontend", "Sales"]} showLabels />
      <TreemapTooltip />
    </NQTreemapChart>
  );
}

export function NQExampleGlowingWaterfallChart() {
  return (
    <NQWaterfallChart data={WATERFALL_DATA} config={WATERFALL_CONFIG} className="h-full w-full p-4">
      <WfGrid /><WfXAxis /><WfYAxis /><Bars /><WfLegend /><WfTooltip />
    </NQWaterfallChart>
  );
}

export function NQExampleGradientAreaVariantAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleGradientColorsAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleGradientColorsBarChart() {
  return (
    <NQBarChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month">
      <BarGrid /><BarXAxis dataKey="month" tickFormatter={formatMonthTickShort} /><BarLegend /><BarTooltip />
      <Bar dataKey="desktop" /><Bar dataKey="mobile" />
    </NQBarChart>
  );
}

export function NQExampleGradientColorsBumpAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleGradientColorsRadarChart() {
  return (
    <NQRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="filled" /><Radar dataKey="mobile" variant="filled" />
    </NQRadarChart>
  );
}

export function NQExampleGradientColorsRadialChart() {
  return (
    <NQRadialChart data={BROWSER_DATA} config={BROWSER_GRADIENT_CONFIG} nameKey="browser" variant="full" className="h-full w-full p-4">
      <RadialLegend isClickable />
      <RadialTooltip />
      <RadialBar dataKey="visitors" />
    </NQRadialChart>
  );
}


export function NQExampleGradientColorsScatterChart() {
  return (
    <NQScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="default" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </NQScatterChart>
  );
}

export function NQExampleGradientReverseAreaVariantAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleHatchedAreaVariantAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="hatched" curveType="monotone" />
      <Area dataKey="mobile" variant="hatched" curveType="monotone" />
    </NQAreaChart>
  );
}


export function NQExampleLinesAreaVariantAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="lines" curveType="monotone" />
      <Area dataKey="mobile" variant="lines" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleLinesVariantRadarChart() {
  return (
    <NQRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="lines" /><Radar dataKey="mobile" variant="filled" />
    </NQRadarChart>
  );
}

export function NQExampleLoadingStateAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default" isLoading>
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleLoadingStateBubbleChart() {
  return (
    <NQScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" isLoading>
      <ScatterGrid /><ScatterXAxis /><YAxis /><ScatterLegend /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="bubble" /><Scatter dataKey="mobile" data={SCATTER_MOBILE} variant="bubble" />
    </NQScatterChart>
  );
}

export function NQExampleLoadingStateFunnelChart() {
  return (
    <NQFunnelChart data={FUNNEL_DATA} config={FUNNEL_CONFIG} className="h-full w-full p-4" isLoading>
      <FunnelYAxis /><FunnelXAxis /><Stages /><FunnelLegend isClickable /><FunnelTooltip />
    </NQFunnelChart>
  );
}

export function NQExampleLoadingStateGaugeChart() {
  return (
    <NQRadialChart data={[{ series: "score", value: 72 }]} config={{ score: { label: "NPS", colors: { light: ["#3b82f6","#10b981"], dark: ["#60a5fa","#34d399"] } } }} nameKey="series" variant="semi" className="h-full w-full p-4" isLoading><RadialTooltip /><RadialBar dataKey="value" /></NQRadialChart>
  );
}

export function NQExampleLoadingStateRadarChart() {
  return (
    <NQRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" isLoading>
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="filled" /><Radar dataKey="mobile" variant="filled" />
    </NQRadarChart>
  );
}

export function NQExampleLoadingStateRadialChart() {
  return (
    <NQRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="full" className="h-full w-full p-4" isLoading><RadialLegend isClickable /><RadialTooltip /><RadialBar dataKey="visitors" /></NQRadialChart>
  );
}


export function NQExampleLoadingStateScatterChart() {
  return (
    <NQScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" isLoading>
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="default" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </NQScatterChart>
  );
}

export function NQExampleLoadingStateSparklineChart() {
  return (
    <NQSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4" isLoading>
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </NQSparklineChart>
  );
}

export function NQExampleLoadingStateTreemapChart() {
  return (
    <NQTreemapChart data={TREEMAP_DATA} config={TREEMAP_CONFIG} className="h-full w-full p-4" isLoading><Tiles /><TreemapTooltip /></NQTreemapChart>
  );
}

export function NQExampleLoadingStateWaterfallChart() {
  return (
    <NQWaterfallChart data={WATERFALL_DATA} config={WATERFALL_CONFIG} className="h-full w-full p-4" isLoading>
      <WfGrid /><WfXAxis /><WfYAxis /><Bars /><WfLegend /><WfTooltip />
    </NQWaterfallChart>
  );
}

export function NQExampleMonotoneyCurveTypeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="bump" />
      <Area dataKey="mobile" variant="gradient" curveType="bump" />
    </NQAreaChart>
  );
}


export function NQExampleRadarChart() {
  return (
    <NQRadarChart data={[...RADAR_SKILLS_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <PolarGrid variant="polygon" /><PolarAngleAxis dataKey="skill" /><RadarLegend isClickable /><RadarTooltip />
      <Radar dataKey="desktop" variant="filled" /><Radar dataKey="mobile" variant="filled" />
    </NQRadarChart>
  );
}

export function NQExampleRadialChart() {
  return (
    <NQRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="full" className="h-full w-full p-4"><RadialLegend isClickable /><RadialTooltip /><RadialBar dataKey="visitors" /></NQRadialChart>
  );
}


export function NQExampleScatterChart() {
  return (
    <NQScatterChart config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4">
      <ScatterGrid /><ScatterXAxis dataKey="x" /><YAxis dataKey="y" /><ScatterLegend isClickable /><ScatterTooltip />
      <Scatter dataKey="desktop" data={SCATTER_DESKTOP} variant="default" />
      <Scatter dataKey="mobile" data={SCATTER_MOBILE} />
    </NQScatterChart>
  );
}

export function NQExampleSemiVariantRadialChart() {
  return (
    <NQRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="semi" className="h-full w-full p-4"><RadialLegend isClickable /><RadialTooltip /><RadialBar dataKey="visitors" /></NQRadialChart>
  );
}

export function NQExampleRoseRadialChart() {
  return (
    <NQRadialChart data={BROWSER_DATA} config={BROWSER_CONFIG} nameKey="browser" variant="full" layout="rose" className="h-full w-full p-4">
      <RadialLegend isClickable />
      <RadialTooltip />
      <RadialBar dataKey="visitors" />
    </NQRadialChart>
  );
}

export function NQExampleSolidAreaVariantAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="solid" curveType="monotone" />
      <Area dataKey="mobile" variant="solid" curveType="monotone" />
    </NQAreaChart>
  );
}



export function NQExampleSolidStrokeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}


export function NQExampleSparklineAreaChart() {
  return (
    <NQSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Fill dataKey="trend" />
      <Sparkline dataKey="trend" />
      <SparkTooltip />
    </NQSparklineChart>
  );
}

export function NQExampleSparklineChart() {
  return (
    <NQSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Fill dataKey="trend" /><Sparkline dataKey="trend" /><SparkTooltip />
    </NQSparklineChart>
  );
}

export function NQExampleStackedTypeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="stacked">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="monotone" />
      <Area dataKey="mobile" variant="gradient" curveType="monotone" />
    </NQAreaChart>
  );
}

export function NQExampleStepCurveTypeAreaChart() {
  return (
    <NQAreaChart data={[...TRAFFIC_MONTHLY_DATA]} config={DUAL_SERIES_CHART_CONFIG} className="h-full w-full p-4" xDataKey="month" stackType="default">
      <Grid /><XAxis dataKey="month" tickFormatter={formatMonthTickShort} /><Legend isClickable /><Tooltip />
      <Area dataKey="desktop" variant="gradient" curveType="step" />
      <Area dataKey="mobile" variant="gradient" curveType="step" />
    </NQAreaChart>
  );
}

export function NQExampleTreemapChart() {
  return (
    <NQTreemapChart data={TREEMAP_DATA} config={TREEMAP_CONFIG} className="h-full w-full p-4"><Tiles /><TreemapTooltip /></NQTreemapChart>
  );
}

export function NQExampleWaterfallChart() {
  return (
    <NQWaterfallChart data={WATERFALL_DATA} config={WATERFALL_CONFIG} className="h-full w-full p-4">
      <WfGrid /><WfXAxis /><WfYAxis /><Bars /><WfLegend /><WfTooltip />
    </NQWaterfallChart>
  );
}

export function NQExampleSparklineEndDotChart() {
  return (
    <NQSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Sparkline dataKey="trend" />
      <SparkTooltip />
    </NQSparklineChart>
  );
}

export function NQExampleSparklineReferenceBandChart() {
  return (
    <NQSparklineChart data={SPARKLINE_DATA} config={SPARKLINE_CONFIG} valueDataKey="value" className="h-full w-full p-4">
      <Fill dataKey="trend" />
      <Sparkline dataKey="trend" />
      <SparkTooltip />
    </NQSparklineChart>
  );
}

