"use client";

import * as React from "react";
import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";

const SQUARE_SIZE = 10;
const GAP = 2;
const CELL_SIZE = SQUARE_SIZE + GAP;

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 273 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 346 },
  { month: "July", desktop: 181 },
  { month: "August", desktop: 392 },
  { month: "September", desktop: 298 },
  { month: "October", desktop: 215 },
  { month: "November", desktop: 327 },
  { month: "December", desktop: 162 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

const MARGIN = { top: 12, right: 16, left: 8, bottom: 36 };
const VIEW_W = 720;
const VIEW_H = 260;

function renderSquareColumn(
  x: number,
  bandWidth: number,
  bottomY: number,
  columnHeight: number,
  fill: string,
  opacity?: number,
) {
  if (columnHeight <= 0) return null;

  const numSquares = Math.max(1, Math.floor(columnHeight / CELL_SIZE));
  const squareSize = Math.min(SQUARE_SIZE, Math.max(2, bandWidth - 2));
  const squareX = x + Math.floor((bandWidth - squareSize) / 2);

  return Array.from({ length: numSquares }, (_, i) => {
    const squareY = bottomY - (i + 1) * CELL_SIZE + GAP;
    return (
      <rect
        key={i}
        x={squareX}
        y={squareY}
        width={squareSize}
        height={squareSize}
        fill={fill}
        opacity={opacity}
      />
    );
  });
}

export function BeeGridBarChart() {
  const total = chartData.reduce((sum, item) => sum + item.desktop, 0);
  const maxData = chartData.reduce(
    (max, item, index) =>
      item.desktop > max.value ? { index, month: item.month, value: item.desktop } : max,
    { index: 0, month: chartData[0]!.month, value: chartData[0]!.desktop },
  );

  const innerW = VIEW_W - MARGIN.left - MARGIN.right;
  const innerH = VIEW_H - MARGIN.top - MARGIN.bottom;
  const yMax = Math.max(...chartData.map((d) => d.desktop)) * 1.08;
  const band = innerW / chartData.length;
  const bottomY = MARGIN.top + innerH;

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[Σ] Total"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">
              {total.toLocaleString()}
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Peak"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">
              {maxData.month.slice(0, 3)}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// CELL: "}
            <span className="text-primary">10x10px</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// TYPE: "}
            <span className="text-primary">GRID</span>
          </span>
        </div>
      </div>
      <hr className="my-4 border-t border-dashed" />
      <ChartContainer config={chartConfig} className="min-h-0 flex-1 [&_[data-slot=chart]]:aspect-auto">
        <div className="relative h-full min-h-[220px] w-full">
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" role="img" aria-label="Grid bar chart">
            {chartData.map((row, index) => {
              const x = MARGIN.left + index * band;
              const valueHeight = (row.desktop / yMax) * innerH;
              return (
                <g key={row.month}>
                  {renderSquareColumn(
                    x,
                    band,
                    bottomY,
                    innerH,
                    "var(--color-desktop-0)",
                    0.1,
                  )}
                  {renderSquareColumn(x, band, bottomY, valueHeight, "var(--color-desktop-0)")}
                </g>
              );
            })}
            {chartData.map((row, index) => {
              const x = MARGIN.left + index * band + band / 2;
              return (
                <text
                  key={`${row.month}-label`}
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
