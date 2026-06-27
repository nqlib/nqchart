import React from "react";

export const TreemapPreview = () => (
  <svg
    className="text-primary relative z-10 h-full w-full"
    viewBox="0 0 900 480"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="120" y="90" width="320" height="280" rx="12" fill="currentColor" fillOpacity="0.25" />
    <rect x="460" y="90" width="200" height="160" rx="12" fill="currentColor" fillOpacity="0.18" />
    <rect x="460" y="270" width="95" height="100" rx="10" fill="var(--color-vesper-type)" />
    <rect x="575" y="270" width="85" height="100" rx="10" fill="var(--color-vesper-type)" stroke="currentColor" strokeWidth="6" />
    <rect x="680" y="90" width="100" height="280" rx="12" fill="currentColor" fillOpacity="0.3" />
  </svg>
);
