import Link from "next/link";

import { AreaPreview } from "@/components/docs/svg-previews/area-preview";
import { BarPreview } from "@/components/docs/svg-previews/bar-preview";
import { ComposedPreview } from "@/components/docs/svg-previews/composed-preview";
import { FunnelPreview } from "@/components/docs/svg-previews/funnel-preview";
import { LinePreview } from "@/components/docs/svg-previews/line-preview";
import { PiePreview } from "@/components/docs/svg-previews/pie-preview";
import { RadarPreview } from "@/components/docs/svg-previews/radar-preview";
import { RadialPreview } from "@/components/docs/svg-previews/radial-preview";
import { ScatterPreview } from "@/components/docs/svg-previews/scatter-preview";
import { TreemapPreview } from "@/components/docs/svg-previews/treemap-preview";
import { WaterfallPreview } from "@/components/docs/svg-previews/waterfall-preview";

type GalleryItem = {
  name: string;
  slug: string;
  Preview: () => React.ReactElement;
};

const CHARTS: GalleryItem[] = [
  { name: "Bar", slug: "bar-chart", Preview: BarPreview },
  { name: "Line", slug: "line-chart", Preview: LinePreview },
  { name: "Area", slug: "area-chart", Preview: AreaPreview },
  { name: "Composed", slug: "composed-chart", Preview: ComposedPreview },
  { name: "Pie", slug: "pie-chart", Preview: PiePreview },
  { name: "Radial", slug: "radial-chart", Preview: RadialPreview },
  { name: "Radar", slug: "radar-chart", Preview: RadarPreview },
  { name: "Scatter", slug: "scatter-chart", Preview: ScatterPreview },
  { name: "Funnel", slug: "funnel-chart", Preview: FunnelPreview },
  { name: "Waterfall", slug: "waterfall-chart", Preview: WaterfallPreview },
  { name: "Treemap", slug: "treemap-chart", Preview: TreemapPreview },
];

export function ChartGallery() {
  return (
    <section className="w-full">
      <div className="mb-8 flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Every chart, one composable API</h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Eleven chart families and counting — each built from the same{" "}
          <code className="text-foreground font-mono text-[13px]">{"Bee*Chart"}</code> primitives.
          Pick one to read its docs and copy the source.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CHARTS.map(({ name, slug, Preview }) => (
          <Link
            key={slug}
            href={`/docs/${slug}/static`}
            className="group focus-visible:ring-ring focus-visible:ring-offset-background flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <div
              className="bg-muted/30 text-foreground/70 group-hover:text-foreground flex aspect-[16/10] items-center justify-center overflow-hidden p-4 transition-colors"
              aria-hidden="true"
            >
              <Preview />
            </div>
            <div className="flex items-center justify-between border-t px-3 py-2">
              <span className="text-sm font-medium">{name}</span>
              <span className="text-muted-foreground group-hover:text-foreground text-xs transition-colors">
                Docs →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
