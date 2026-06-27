import { SVGProps } from "@/types/svg";
import * as React from "react";

function BeeChartMarkPaths() {
  return (
    <>
      {/* Background — tucked to edges so the bee stays dominant */}
      <g stroke="currentColor" strokeWidth="0.5" opacity="0.07">
        <path d="M8 6v36M16 6v36M24 6v36M32 6v36M40 6v36" />
        <path d="M6 8h36M6 16h36M6 24h36M6 32h36M6 40h36" />
      </g>
      <g fill="currentColor" opacity="0.07">
        <rect x="4" y="36" width="2.5" height="6" rx="0.5" />
        <rect x="8" y="33" width="2.5" height="9" rx="0.5" />
        <rect x="12" y="35" width="2.5" height="7" rx="0.5" />
      </g>
      <path
        d="M36 10l2.5-1.5 2.5 3 3.5-4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.09"
      />

      {/* Soft plate — separates bee from grid */}
      <circle cx="24" cy="26" r="17" fill="currentColor" opacity="0.08" />

      {/* Wings — larger, more legible */}
      <path
        d="M14 27C6 14 8 6 17 13L20 27L14 27Z"
        fill="currentColor"
        opacity="0.42"
      />
      <path
        d="M34 27C42 14 40 6 31 13L28 27L34 27Z"
        fill="currentColor"
        opacity="0.42"
      />

      {/* Body — gold abdomen */}
      <path
        d="M24 14L35.1 20.5L35.1 31.5L24 38L12.9 31.5L12.9 20.5L24 14Z"
        fill="var(--logo-gold)"
      />
      {/* Stripes — dark bands across the abdomen */}
      <path
        d="M16.5 22H31.5M15.5 26H32.5M16.5 30H31.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Head + antennae — primary accent */}
      <circle cx="24" cy="11.5" r="4" fill="var(--primary)" />
      <path
        d="M21.2 9.2V5.8M26.8 9.2V5.8"
        stroke="var(--primary)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="21.2" cy="4.8" r="1.5" fill="var(--primary)" />
      <circle cx="26.8" cy="4.8" r="1.5" fill="var(--primary)" />

      {/* Stinger — primary accent reinforces silhouette */}
      <path d="M24 38L22 42.5H26L24 38Z" fill="var(--primary)" />
    </>
  );
}

/** Abstract bee on a BI-style grid with subtle bar hints. */
export function BeeChartMark({
  width = "48",
  height = "48",
  ...props
}: SVGProps & { width?: string; height?: string }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <BeeChartMarkPaths />
    </svg>
  );
}

const BeeChartWordmark = ({
  width = "220",
  height = "48",
  ...props
}: SVGProps & { width?: string; height?: string }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 220 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="BeeCharts"
    {...props}
  >
    <BeeChartMarkPaths />
    <text
      x="58"
      y="32"
      fill="currentColor"
      fontFamily="var(--font-geist-sans, system-ui, sans-serif)"
      fontSize="20"
      fontWeight="600"
      letterSpacing="-0.02em"
    >
      BeeCharts
    </text>
  </svg>
);

export default BeeChartWordmark;
