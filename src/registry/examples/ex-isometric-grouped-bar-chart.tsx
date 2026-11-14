"use client";

import * as React from "react";
import { ChartContainer, type ChartConfig } from "@/registry/ui/chart";
import { ISO_MONTHS, ISO_VIEW, isoPlot, prismSide, prismTop } from "@/registry/examples/iso-prism";

const config = {
  desktop: { label: "Desktop", colors: { light: ["#10b981"], dark: ["#10b981"] } },
  mobile: { label: "Mobile", colors: { light: ["#f43f5e"], dark: ["#f43f5e"] } },
} satisfies ChartConfig;

const Y_MAX = 80;

export function NQExampleIsometricGroupedBarChart() {
  const [active, setActive] = React.useState<number | null>(null);
  const plot = isoPlot();
  const band = plot.w / ISO_MONTHS.length;
  const barW = 22;
  const pairGap = 8;

  return (
    <ChartContainer config={config} className="flex h-full w-full flex-col gap-3 p-4 [&_[data-slot=chart]]:aspect-auto">
      <svg viewBox={`0 0 ${ISO_VIEW.w} ${ISO_VIEW.h}`} className="min-h-0 w-full flex-1" role="img" aria-label="Isometric grouped bars, Desktop and Mobile">
        {Array.from({ length: 4 }, (_, i) => {
          const y = plot.y + (i / 3) * plot.h;
          return <line key={i} x1={plot.x} y1={y} x2={plot.x + plot.w} y2={y} stroke="currentColor" strokeOpacity={0.08} />;
        })}
        {ISO_MONTHS.map((row, index) => {
          const origin = plot.x + index * band + (band - barW * 2 - pairGap) / 2;
          const bars = [
            { key: "desktop", x: origin, value: row.desktop, fill: "var(--color-desktop-0)" },
            { key: "mobile", x: origin + barW + pairGap, value: row.mobile, fill: "var(--color-mobile-0)" },
          ];
          const dim = active != null && active !== index;
          return (
            <g key={row.month} opacity={dim ? 0.35 : 1} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}>
              {bars.map((bar) => {
                const height = (bar.value / Y_MAX) * plot.h;
                const y = plot.y + plot.h - height;
                return (
                  <g key={bar.key}>
                    <polygon points={prismSide(bar.x, y, barW, height)} fill={bar.fill} opacity={0.55} />
                    <polygon points={prismTop(bar.x, y, barW)} fill={bar.fill} opacity={0.8} />
                    <rect x={bar.x} y={y} width={barW} height={height} fill={bar.fill} />
                  </g>
                );
              })}
              <rect x={plot.x + index * band} y={plot.y} width={band} height={plot.h} fill="transparent" />
              <text x={plot.x + index * band + band / 2} y={ISO_VIEW.h - 10} textAnchor="middle" className="fill-muted-foreground text-[12px]">
                {row.month}
              </text>
            </g>
          );
        })}
      </svg>
      <SeriesLegend />
    </ChartContainer>
  );
}

function SeriesLegend() {
  return (
    <ul className="text-muted-foreground flex gap-4 text-xs">
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-[3px]" style={{ background: "var(--color-desktop-0)" }} />
        Desktop
      </li>
      <li className="flex items-center gap-2">
        <span className="size-2.5 rounded-[3px]" style={{ background: "var(--color-mobile-0)" }} />
        Mobile
      </li>
    </ul>
  );
}
