"use client";

import { ChartContainer, type ChartConfig } from "@/registry/ui/chart";
import {
  ISO,
  ISO_MONTHS,
  ISO_VIEW,
  isoPlot,
  ribbonPoints,
  sampleMonotone,
} from "@/registry/examples/iso-prism";

const config = {
  desktop: { label: "Desktop", colors: { light: ["#10b981"], dark: ["#10b981"] } },
  mobile: { label: "Mobile", colors: { light: ["#f43f5e"], dark: ["#f43f5e"] } },
} satisfies ChartConfig;

const Y_MAX = 80;

function seriesRibbon(key: "desktop" | "mobile", depth: number) {
  const plot = isoPlot();
  const step = plot.w / (ISO_MONTHS.length - 1);
  const knots = ISO_MONTHS.map((row, index) => ({
    x: plot.x + index * step,
    y: plot.y + plot.h - (row[key] / Y_MAX) * plot.h,
  }));
  const front = sampleMonotone(knots);
  const baseline = plot.y + plot.h;
  const area = [
    ...front.map((p) => `${p.x},${p.y}`),
    `${front[front.length - 1]!.x},${baseline}`,
    `${front[0]!.x},${baseline}`,
  ].join(" ");
  return { front, area, ribbon: ribbonPoints(front, ISO.dx * depth, ISO.dy * depth), depth };
}

export function NQExampleIsometricAreaChart() {
  const plot = isoPlot();
  const mobile = seriesRibbon("mobile", 2.2);
  const desktop = seriesRibbon("desktop", 1);

  return (
    <ChartContainer config={config} className="flex h-full w-full flex-col gap-3 p-4 [&_[data-slot=chart]]:aspect-auto">
      <svg viewBox={`0 0 ${ISO_VIEW.w} ${ISO_VIEW.h}`} className="min-h-0 w-full flex-1" role="img" aria-label="Isometric area. Both series use a monotone curve.">
        <line x1={plot.x} y1={plot.y + plot.h} x2={plot.x + plot.w} y2={plot.y + plot.h} stroke="currentColor" strokeOpacity={0.16} />
        <Ribbon fill="var(--color-mobile-0)" area={mobile.area} ribbon={mobile.ribbon} front={mobile.front} depth={mobile.depth} />
        <Ribbon fill="var(--color-desktop-0)" area={desktop.area} ribbon={desktop.ribbon} front={desktop.front} depth={desktop.depth} />
        {ISO_MONTHS.map((row, index) => {
          const step = plot.w / (ISO_MONTHS.length - 1);
          return (
            <text key={row.month} x={plot.x + index * step} y={ISO_VIEW.h - 10} textAnchor="middle" className="fill-muted-foreground text-[12px]">
              {row.month}
            </text>
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

function Ribbon({
  fill,
  area,
  ribbon,
  front,
  depth,
}: {
  fill: string;
  area: string;
  ribbon: string;
  front: { x: number; y: number }[];
  depth: number;
}) {
  const shift = `translate(${ISO.dx * depth} ${-ISO.dy * depth})`;
  return (
    <g>
      <polygon points={area} fill={fill} opacity={0.28} transform={shift} />
      <polygon points={ribbon} fill={fill} opacity={0.55} />
      <polygon points={area} fill={fill} opacity={0.82} />
      <polyline
        points={front.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke={fill}
        strokeWidth={1.5}
      />
    </g>
  );
}
