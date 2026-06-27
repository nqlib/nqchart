import React from "react";

export const FunnelPreview = () => (
  <svg
    className="text-primary relative z-10 h-full w-full"
    viewBox="0 0 900 480"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M250 110h400L590 190H310L250 110Z" fill="currentColor" fillOpacity="0.22" />
    <path d="M310 190h280L520 270H380L310 190Z" fill="currentColor" fillOpacity="0.32" />
    <path
      d="M380 270h140L470 350H430L380 270Z"
      fill="var(--color-vesper-type)"
      stroke="currentColor"
      strokeWidth="6"
    />
  </svg>
);
