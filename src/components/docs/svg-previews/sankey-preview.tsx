import React from "react";

export const SankeyPreview = () => (
  <svg
    className="text-primary relative z-10 h-full w-full"
    viewBox="0 0 900 480"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Flows: two sources merge into a middle node, then split. */}
    <path d="M232 100C340 100 340 110 448 110V230C340 230 340 220 232 220Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M232 240C340 240 340 230 448 230V370C340 370 340 380 232 380Z" fill="currentColor" fillOpacity="0.28" />
    <path d="M468 110C570 110 570 80 668 80V240C570 240 570 270 468 270Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M468 270C570 270 570 280 668 280V380C570 380 570 370 468 370Z" fill="currentColor" fillOpacity="0.32" />
    {/* Nodes */}
    <rect x="212" y="100" width="20" height="120" rx="4" fill="currentColor" fillOpacity="0.55" />
    <rect x="212" y="240" width="20" height="140" rx="4" fill="currentColor" fillOpacity="0.55" />
    <rect x="448" y="110" width="20" height="260" rx="4" fill="currentColor" />
    <rect x="668" y="80" width="20" height="160" rx="4" fill="currentColor" fillOpacity="0.55" />
    <rect
      x="668"
      y="280"
      width="20"
      height="100"
      rx="4"
      fill="var(--color-vesper-type)"
      stroke="currentColor"
      strokeWidth="6"
    />
  </svg>
);
