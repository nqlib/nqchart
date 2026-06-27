import React from "react";

export const SparklinePreview = () => (
  <svg
    className="text-primary relative z-10 h-full w-full"
    viewBox="0 0 900 480"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M120 320 L220 280 L340 300 L460 240 L580 260 L700 200 L780 220"
      stroke="currentColor"
      strokeOpacity="0.25"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M120 300 L220 250 L340 270 L460 210 L580 230 L700 170 L780 190"
      stroke="var(--color-vesper-type)"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      className="text-background"
      cx="780"
      cy="190"
      r="16"
      fill="var(--color-vesper-type)"
      stroke="currentColor"
      strokeWidth="7"
    />
  </svg>
);
