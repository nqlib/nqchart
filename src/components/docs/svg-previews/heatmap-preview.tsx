import React from "react";

const CELLS = [
  { x: 280, y: 120, opacity: 0.22 },
  { x: 380, y: 120, opacity: 0.38 },
  { x: 480, y: 120, opacity: 0.52 },
  { x: 580, y: 120, opacity: 0.34 },
  { x: 280, y: 210, opacity: 0.3 },
  { x: 380, y: 210, opacity: 0.72 },
  { x: 480, y: 210, opacity: 0.88 },
  { x: 580, y: 210, opacity: 0.46 },
  { x: 280, y: 300, opacity: 0.42 },
  { x: 380, y: 300, opacity: 0.58 },
  { x: 480, y: 300, opacity: 1 },
  { x: 580, y: 300, opacity: 0.64 },
] as const;

export function HeatmapPreview() {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {CELLS.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width="72"
          height="64"
          rx="8"
          fill="currentColor"
          fillOpacity={cell.opacity}
        />
      ))}
      <rect
        x="248"
        y="396"
        width="404"
        height="12"
        rx="6"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <rect
        x="248"
        y="396"
        width="280"
        height="12"
        rx="6"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}
