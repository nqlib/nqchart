import { ComposedPreview } from "@/components/docs/svg-previews/composed-preview";
import { SankeyPreview } from "@/components/docs/svg-previews/sankey-preview";
import { RadialPreview } from "@/components/docs/svg-previews/radial-preview";
import { RadarPreview } from "@/components/docs/svg-previews/radar-preview";
import { LinePreview } from "@/components/docs/svg-previews/line-preview";
import { AreaPreview } from "@/components/docs/svg-previews/area-preview";
import { PiePreview } from "@/components/docs/svg-previews/pie-preview";
import { BarPreview } from "@/components/docs/svg-previews/bar-preview";
import { ScatterPreview } from "@/components/docs/svg-previews/scatter-preview";
import { TreemapPreview } from "@/components/docs/svg-previews/treemap-preview";
import { FunnelPreview } from "@/components/docs/svg-previews/funnel-preview";
import { WaterfallPreview } from "@/components/docs/svg-previews/waterfall-preview";
import { SparklinePreview } from "@/components/docs/svg-previews/sparkline-preview";
import { HeatmapPreview } from "@/components/docs/svg-previews/heatmap-preview";
import { CalendarPreview } from "@/components/docs/svg-previews/calendar-preview";
import { Grid } from "@/components/docs/svg-previews/background-grid";
import Link from "next/link";

interface Chart {
  name: string;
  description: string;
  Component: React.ComponentType;
  url: string;
}

const CHARTS: Chart[] = [
  {
    name: "Area Chart",
    description: "Highlight trends with filled area ranges.",
    Component: AreaPreview,
    url: "/docs/area-chart",
  },
  {
    name: "Line Chart",
    description: "Track change over time with lines.",
    Component: LinePreview,
    url: "/docs/line-chart",
  },
  {
    name: "Bar Chart",
    description: "Compare categories quickly with bold bars.",
    Component: BarPreview,
    url: "/docs/bar-chart",
  },
  {
    name: "Composed Chart",
    description: "Mix lines, bars, areas in one.",
    Component: ComposedPreview,
    url: "/docs/composed-chart",
  },
  {
    name: "Radar Chart",
    description: "Compare multi-metric profiles on radial axes.",
    Component: RadarPreview,
    url: "/docs/radar-chart",
  },
  {
    name: "Pie Chart",
    description: "Show parts of a whole, clearly.",
    Component: PiePreview,
    url: "/docs/pie-chart",
  },
  {
    name: "Heatmap Chart",
    description: "Map intensity across row and column grids.",
    Component: HeatmapPreview,
    url: "/docs/heatmap-chart",
  },
  {
    name: "Calendar Chart",
    description: "Day-level calendar grids for workload and activity.",
    Component: CalendarPreview,
    url: "/docs/calendar-chart",
  },
  {
    name: "Radial Chart",
    description: "Visualize totals in a circular layout.",
    Component: RadialPreview,
    url: "/docs/radial-chart",
  },
  {
    name: "Sankey Chart",
    description: "Show flows between stages with weighted links.",
    Component: SankeyPreview,
    url: "/docs/sankey-chart",
  },
  {
    name: "Scatter Chart",
    description: "Explore correlations between two variables.",
    Component: ScatterPreview,
    url: "/docs/scatter-chart",
  },
  {
    name: "Treemap Chart",
    description: "Break down categories by weighted area tiles.",
    Component: TreemapPreview,
    url: "/docs/treemap-chart",
  },
  {
    name: "Funnel Chart",
    description: "Track conversion drop-off across stages.",
    Component: FunnelPreview,
    url: "/docs/funnel-chart",
  },
  {
    name: "Waterfall Chart",
    description: "Bridge totals with increases and decreases.",
    Component: WaterfallPreview,
    url: "/docs/waterfall-chart",
  },
  {
    name: "Sparkline Chart",
    description: "Inline trend strips for KPIs and dense layouts.",
    Component: SparklinePreview,
    url: "/docs/sparkline-chart",
  },
];

interface ShowcaseItemProps {
  Component: React.ComponentType;
  description: string;
  url: string;
  name: string;
}

const ShowcaseItem = ({ name, description, url, Component }: ShowcaseItemProps) => {
  return (
    <Link href={url}>
      <div className="bg-muted group cursor-pointer rounded-md p-1">
        <div className="bg-background group-hover:border-primary/20 relative h-40 rounded-[5px] border duration-200">
          <Grid />
          <Component />
        </div>
        <div className="flex flex-col gap-1 p-2">
          <p className="group-hover:text-primary text-xs font-medium">{name}</p>
          <p className="text-muted-foreground text-[11px]">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const ShowcaseGrid = () => {
  return (
    <div className="mt-6 grid grid-flow-row grid-cols-1 gap-8 sm:grid-cols-2">
      {CHARTS.map(({ name, description, url, Component }) => (
        <ShowcaseItem
          key={name}
          name={name}
          description={description}
          url={url}
          Component={Component}
        />
      ))}
    </div>
  );
};

export { ShowcaseGrid };
