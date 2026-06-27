"use client";

import * as React from "react";
import { motion } from "motion/react";
import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";

const chartData = [
  { month: "January", revenue: 28 },
  { month: "February", revenue: 34 },
  { month: "March", revenue: 22 },
  { month: "April", revenue: 41 },
  { month: "May", revenue: 47 },
  { month: "June", revenue: 31 },
  { month: "July", revenue: 38 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

const DX = 10;
const DY = 10;
const BEVEL_OPACITY = 0.55;
const DIRECTION: "left" | "right" = "right";
const HIGHLIGHT_COLOR = "#22c55e";
const HIGHLIGHT_COLOR_DARK = "#15803d";

const MARGIN = { top: 28, right: 36, left: 8, bottom: 36 };
const VIEW_W = 640;
const VIEW_H = 280;
const Y_MAX = 57;

type ShapeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: { month: string; revenue: number };
  maxValue: number;
  idPrefix: string;
  hoveredIndex: number | null;
};

function IsoBar({ x, y, width, height, index, payload, maxValue, idPrefix, hoveredIndex }: ShapeProps) {
  if (height <= 0) return null;

  const isHovered = hoveredIndex === index;
  const highlight =
    isHovered || (hoveredIndex === null && payload.revenue === maxValue);
  const dimmed = hoveredIndex !== null && !isHovered;
  const dx = DIRECTION === "left" ? -DX : DX;
  const sideX = DIRECTION === "left" ? x : x + width;
  const topPoints = `${x},${y} ${x + width},${y} ${x + width + dx},${y - DY} ${x + dx},${y - DY}`;
  const sidePoints = `${sideX},${y} ${sideX + dx},${y - DY} ${sideX + dx},${y + height - DY} ${sideX},${y + height}`;
  const url = (name: string) => `url(#${idPrefix}-${name})`;
  const strokeColor = highlight ? HIGHLIGHT_COLOR_DARK : "var(--color-revenue-0)";

  const frontFill = highlight ? url("iso-front-accent") : url("iso-front-base");
  const topFill = highlight ? url("iso-top-accent") : url("iso-top-base");
  const rightFill = highlight ? url("iso-right-accent") : url("iso-right-base");
  const hatchFill = highlight ? url("iso-hatch-accent") : url("iso-hatch-base");

  return (
    <motion.g
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{
        scaleY: 1,
        opacity: dimmed ? 0.32 : 1,
        scaleX: isHovered ? 1.06 : 1,
      }}
      transition={{
        duration: isHovered || dimmed ? 0.2 : 0.7,
        delay: hoveredIndex === null ? index * 0.08 : 0,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
    >
      <polygon points={sidePoints} fill={rightFill} />
      <polygon points={topPoints} fill={topFill} />
      <rect x={x} y={y} width={width} height={height} fill={frontFill} stroke={strokeColor} strokeWidth={0} />
      <rect x={x} y={y} width={width} height={height} fill={hatchFill} />
      {highlight ? <rect x={x} y={y} width={2} height={height} fill="rgba(0,0,0,0.15)" /> : null}
    </motion.g>
  );
}

function IsoBarDefs({ idPrefix }: { idPrefix: string }) {
  return (
    <defs>
      <linearGradient id={`${idPrefix}-iso-front-base`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-revenue-0)" stopOpacity={1} />
        <stop offset="100%" stopColor="var(--color-revenue-0)" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id={`${idPrefix}-iso-top-base`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--color-revenue-0)" stopOpacity={BEVEL_OPACITY} />
        <stop offset="100%" stopColor="var(--color-revenue-0)" stopOpacity={BEVEL_OPACITY * 0.9} />
      </linearGradient>
      <linearGradient id={`${idPrefix}-iso-right-base`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-revenue-0)" stopOpacity={BEVEL_OPACITY * 0.7} />
        <stop offset="100%" stopColor="var(--color-revenue-0)" stopOpacity={BEVEL_OPACITY * 0.55} />
      </linearGradient>

      <linearGradient id={`${idPrefix}-iso-front-accent`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={HIGHLIGHT_COLOR} stopOpacity={1} />
        <stop offset="100%" stopColor={HIGHLIGHT_COLOR_DARK} stopOpacity={0.95} />
      </linearGradient>
      <linearGradient id={`${idPrefix}-iso-top-accent`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={HIGHLIGHT_COLOR} stopOpacity={BEVEL_OPACITY + 0.15} />
        <stop offset="100%" stopColor={HIGHLIGHT_COLOR} stopOpacity={BEVEL_OPACITY} />
      </linearGradient>
      <linearGradient id={`${idPrefix}-iso-right-accent`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={HIGHLIGHT_COLOR_DARK} stopOpacity={BEVEL_OPACITY + 0.05} />
        <stop offset="100%" stopColor={HIGHLIGHT_COLOR_DARK} stopOpacity={BEVEL_OPACITY * 0.7} />
      </linearGradient>

      <pattern
        id={`${idPrefix}-iso-hatch-base`}
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
      </pattern>
      <pattern
        id={`${idPrefix}-iso-hatch-accent`}
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="6" stroke={HIGHLIGHT_COLOR_DARK} strokeWidth="1" strokeOpacity="0.15" />
      </pattern>
    </defs>
  );
}

function layoutBars(data: typeof chartData) {
  const innerW = VIEW_W - MARGIN.left - MARGIN.right;
  const innerH = VIEW_H - MARGIN.top - MARGIN.bottom;
  const band = innerW / data.length;
  const barW = band * 0.75;
  const offset = (band - barW) / 2;

  return data.map((row, index) => {
    const x = MARGIN.left + index * band + offset;
    const height = (row.revenue / Y_MAX) * innerH;
    const y = MARGIN.top + innerH - height;
    return { x, y, width: barW, height, index, payload: row };
  });
}

export function BeeIsometricBarChart() {
  const idPrefix = React.useId().replace(/:/g, "");
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const maxValue = React.useMemo(
    () => chartData.reduce((m, d) => (d.revenue > m ? d.revenue : m), 0),
    [],
  );
  const total = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const peak = chartData.find((d) => d.revenue === maxValue)!;
  const bars = layoutBars(chartData);
  const innerH = VIEW_H - MARGIN.top - MARGIN.bottom;
  const band = (VIEW_W - MARGIN.left - MARGIN.right) / chartData.length;
  const hover = hoveredIndex != null ? chartData[hoveredIndex] : null;

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[$] Total"}</span>
            <span className="text-primary font-mono text-3xl">
              <span className="text-muted-foreground text-xl font-normal">$</span>
              <span className="tracking-tighter">{total}K</span>
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Peak"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">{peak.month.slice(0, 3)}</span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// PROJECTION: "}
            <span className="text-primary">ISOMETRIC</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// HIGHLIGHT: "}
            <span className="text-primary">MAX</span>
          </span>
        </div>
      </div>
      <hr className="my-4 border-t border-dashed" />
      <ChartContainer config={chartConfig} className="min-h-0 flex-1 [&_[data-slot=chart]]:aspect-auto">
        <div className="relative h-full min-h-[220px] w-full">
          {hover ? (
            <div className="bg-background/95 text-foreground border-border/50 pointer-events-none absolute right-2 top-0 z-10 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
              <div className="font-medium">{hover.month}</div>
              <div className="text-muted-foreground font-mono tabular-nums">${hover.revenue}K</div>
            </div>
          ) : null}
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-full w-full"
            role="img"
            aria-label="Isometric revenue bar chart"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <IsoBarDefs idPrefix={idPrefix} />
            {Array.from({ length: 5 }, (_, i) => {
              const y = MARGIN.top + (i / 4) * (VIEW_H - MARGIN.top - MARGIN.bottom);
              return (
                <line
                  key={i}
                  x1={MARGIN.left}
                  y1={y}
                  x2={VIEW_W - MARGIN.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                />
              );
            })}
            {bars.map((bar) => (
              <g key={bar.payload.month} className="cursor-pointer">
                <rect
                  x={MARGIN.left + bar.index * band}
                  y={MARGIN.top}
                  width={band}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(bar.index)}
                />
                <IsoBar
                  {...bar}
                  maxValue={maxValue}
                  idPrefix={idPrefix}
                  hoveredIndex={hoveredIndex}
                />
              </g>
            ))}
            {chartData.map((row, index) => {
              const band = (VIEW_W - MARGIN.left - MARGIN.right) / chartData.length;
              const x = MARGIN.left + index * band + band / 2;
              return (
                <text
                  key={row.month}
                  x={x}
                  y={VIEW_H - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {row.month.slice(0, 3)}
                </text>
              );
            })}
          </svg>
        </div>
      </ChartContainer>
    </div>
  );
}
