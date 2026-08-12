"use client";

import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";
import type { EChartsType } from "echarts/core";

const ChartInstanceContext = createContext<RefObject<EChartsType | null> | null>(null);

export function ChartInstanceProvider({ children }: { children: ReactNode }) {
  const ref = useRef<EChartsType | null>(null);
  return (
    <ChartInstanceContext.Provider value={ref}>{children}</ChartInstanceContext.Provider>
  );
}

export function useChartInstanceRef(): RefObject<EChartsType | null> {
  const ctx = useContext(ChartInstanceContext);
  const fallback = useRef<EChartsType | null>(null);
  return ctx ?? fallback;
}

export function useSetChartInstance() {
  const ref = useChartInstanceRef();
  return (instance: EChartsType | null) => {
    ref.current = instance;
  };
}
