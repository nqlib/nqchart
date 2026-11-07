"use client";

/**
 * Dashboard performance instrument — plan 022.
 *
 * Renders registry examples in a dense grid so a BI-sized page is one URL:
 *   /perf-check                 → the BI mix (24 charts)
 *   /perf-check?set=all         → every example and block
 *   /perf-check?copies=4        → each chart N times
 *
 * Like `/bi-check`, this is an instrument, not a demo. The Playwright/CDP probe reads
 * `window.__perf` (mount time) and drives hover / scroll / theme toggles against it.
 */

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { Index } from "@/registry/__index__";

const BI_MIX = [
  "ex-kpi-card",
  "ex-bar-chart",
  "ex-stacked-type-bar-chart",
  "ex-horizontal-layout-bar-chart",
  "ex-line-chart",
  "ex-area-chart",
  "ex-stacked-type-area-chart",
  "ex-composed-chart",
  "ex-pareto-chart",
  "ex-variance-chart",
  "ex-forecast-chart",
  "ex-pie-chart",
  "ex-pie-rose-chart",
  "ex-funnel-chart",
  "ex-waterfall-chart",
  "ex-heatmap-chart",
  "ex-cohort-retention-chart",
  "ex-treemap-chart",
  "ex-sankey-chart",
  "ex-scatter-chart",
  "ex-radar-chart",
  "ex-radial-chart",
  "ex-gauge-chart",
  "ex-sparkline-chart",
];

const SKIP = /loading-state/;

function allNames(): string[] {
  return Object.keys(Index).filter(
    (k) => Index[k]?.type === "registry:block" && !SKIP.test(k),
  );
}

export default function PerfCheckPage() {
  return (
    <Suspense fallback={null}>
      <PerfGrid />
    </Suspense>
  );
}

function PerfGrid() {
  const q = useSearchParams();
  const params = useMemo(
    () => ({
      set: q.get("set") ?? "bi",
      copies: Math.max(1, Math.min(20, Number(q.get("copies") ?? 1) || 1)),
      only: q.get("only"),
    }),
    [q],
  );

  useEffect(() => {
    (window as unknown as { __perf: Record<string, number> }).__perf = {
      mountedAt: performance.now(),
    };
  }, []);

  const names = useMemo(() => {
    const base = params.only
      ? params.only.split(",")
      : params.set === "all"
        ? allNames()
        : BI_MIX;
    return Array.from({ length: params.copies }, (_, c) => base.map((n) => ({ n, key: `${c}-${n}` }))).flat();
  }, [params]);

  return (
    <main className="bg-background text-foreground min-h-screen p-4">
      <h1 className="mb-3 font-mono text-sm">
        perf-check · {names.length} charts · set={params.set} copies={params.copies}
      </h1>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" data-perf-grid>
        {names.map(({ n, key }) => {
          const Component = Index[n]?.component;
          return (
            <section
              key={key}
              data-perf-card={n}
              className="bg-card flex h-[340px] min-w-0 flex-col overflow-hidden rounded-xl border"
            >
              <div className="text-muted-foreground border-b px-3 py-1.5 font-mono text-[10px]">{n}</div>
              <div className="flex min-h-0 flex-1 items-center justify-center p-2">
                {Component ? (
                  <Suspense fallback={null}>
                    <Component />
                  </Suspense>
                ) : (
                  <span className="text-destructive text-xs">missing</span>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
