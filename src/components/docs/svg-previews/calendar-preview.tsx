import React from "react";

const CELLS = [
  { x: 248, y: 88, opacity: 0.18 },
  { x: 328, y: 88, opacity: 0.32 },
  { x: 408, y: 88, opacity: 0.48 },
  { x: 488, y: 88, opacity: 0.28 },
  { x: 568, y: 88, opacity: 0.62 },
  { x: 648, y: 88, opacity: 0.4 },
  { x: 248, y: 168, opacity: 0.36 },
  { x: 328, y: 168, opacity: 0.72 },
  { x: 408, y: 168, opacity: 0.88 },
  { x: 488, y: 168, opacity: 0.54 },
  { x: 568, y: 168, opacity: 0.44 },
  { x: 648, y: 168, opacity: 0.26 },
  { x: 248, y: 248, opacity: 0.42 },
  { x: 328, y: 248, opacity: 0.58 },
  { x: 408, y: 248, opacity: 1 },
  { x: 488, y: 248, opacity: 0.66 },
  { x: 568, y: 248, opacity: 0.34 },
  { x: 648, y: 248, opacity: 0.22 },
] as const;

export function CalendarPreview() {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x="248" y="64" fill="currentColor" fillOpacity="0.35" fontSize="18" fontFamily="system-ui">
        June 2025
      </text>
      {CELLS.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width="56"
          height="56"
          rx="6"
          fill="currentColor"
          fillOpacity={cell.opacity}
        />
      ))}
      <rect
        x="248"
        y="356"
        width="456"
        height="12"
        rx="6"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <rect
        x="248"
        y="356"
        width="320"
        height="12"
        rx="6"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}
