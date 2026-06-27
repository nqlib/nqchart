import React from "react";

export const ScatterPreview = () => {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="220" cy="340" r="13" fill="currentColor" fillOpacity="0.25" />
      <circle cx="310" cy="280" r="13" fill="currentColor" fillOpacity="0.25" />
      <circle cx="390" cy="360" r="13" fill="currentColor" fillOpacity="0.25" />
      <circle cx="470" cy="220" r="13" fill="currentColor" fillOpacity="0.25" />
      <circle cx="560" cy="300" r="13" fill="currentColor" fillOpacity="0.25" />
      <circle cx="640" cy="180" r="13" fill="currentColor" fillOpacity="0.25" />
      <circle
        className="text-background"
        cx="260"
        cy="180"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="360"
        cy="120"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="450"
        cy="160"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="540"
        cy="90"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="620"
        cy="130"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
    </svg>
  );
};
