"use client";

import * as React from "react";
import { ChartContainer, type ChartConfig } from "@/registry/ui/chart";
import { ISO_MONTHS, ISO_VIEW, isoPlot, prismSide, prismTop } from "@/registry/examples/iso-prism";

const config = {
  desktop: { label: "Desktop", colors: { light: ["#10b981"], dark: ["#10b981"] } },
  mobile: { label: "Mobile", colors: { light: ["#f43f5e"], dark: ["#f43f5e"] } },
} satisfies ChartConfig;

const Y_MAX = 120;

export function NQExampleIsometricStackedBarChart() {
  const [active, setActive] = React.useState<number | null>(null);
  const plot = isoPlot();
  const band = plot.w / ISO_MONTHS.length;
  const barW = 36;

  return (
    <ChartContainer config={config} className="flex h-full w-full flex-col gap-3 p-4 [&_[data-slot=chart]]:aspect-auto">
      <svg viewBox={`0 0 ${ISO_VIEW.w} ${ISO_VIEW.h}`} className="min-h-0 w-full flex-1" role="img" aria-label="Isometric stacked bars. Segments are flush. Only the top of the stack is capped.">
        {Array.from({ length: 4 }, (_, i) => {
          const y = plot.y + (i / 3) * plot.h;
          return <line key={i} x1={plot.x} y1={y} x2={plot.x + plot.w} y2={y} stroke="currentColor" strokeOpacity={0.08} />;
        })}
        {ISO_MONTHS.map((row, index) => {
          const x = plot.x + index * band + (band - barW) / 2;
          const desktopH = (row.desktop / Y_MAX) * plot.h;
          const mobileH = (row.mobile / Y_MAX) * plot.h;
          const baseY = plot.y + plot.h;
          const desktopY = baseY - desktopH;
          const mobileY = desktopY - mobileH;
          const dim = active != null && active !== index;
          return (
            <g key={row.month} opacity={dim ? 0.35 : 1} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}>
              <polygon points={prismSide(x, desktopY, barW, desktopH)} fill="var(--color-desktop-0)" opacity={0.55} />
              <rect x={x} y={desktopY} width={barW} height={desktopH} fill="var(--color-desktop-0)" />
              <polygon points={prismSide(x, mobileY, barW, mobileH)} fill="var(--color-mobile-0)" opacity={0.55} />
              <polygon points={prismTop(x, mobileY, barW)} fill="var(--color-mobile-0)" opacity={0.85} />
              <rect x={x} y={mobileY} width={barW} height={mobileH} fill="var(--color-mobile-0)" />
              <rect x={plot.x + index * band} y={plot.y} width={band} height={plot.h} fill="transparent" />
              <text x={plot.x + index * band + band / 2} y={ISO_VIEW.h - 10} textAnchor="middle" className="fill-muted-foreground text-[12px]">
                {row.month}
              </text>
            </g>
          );
        })}
      </svg>
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
    </ChartContainer>
  );
}
