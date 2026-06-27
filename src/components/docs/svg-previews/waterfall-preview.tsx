import React from "react";

export const WaterfallPreview = () => (
  <svg
    className="text-primary relative z-10 h-full w-full"
    viewBox="0 0 900 480"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="180" y="170" width="70" height="210" rx="8" fill="currentColor" fillOpacity="0.25" />
    <rect x="290" y="120" width="70" height="90" rx="8" fill="var(--color-vesper-type)" stroke="currentColor" strokeWidth="6" />
    <rect x="400" y="150" width="70" height="60" rx="8" fill="currentColor" fillOpacity="0.35" />
    <rect x="510" y="90" width="70" height="80" rx="8" fill="var(--color-vesper-type)" />
    <rect x="620" y="130" width="70" height="250" rx="8" fill="currentColor" fillOpacity="0.28" />
  </svg>
);
