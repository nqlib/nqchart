"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";

import { LazyMount } from "@/components/docs/charts/lazy-mount";
import { Skeleton } from "@/components/ui/skeleton";

const DemoDashboard = dynamic(
  () => import("./demo-dashboard").then((m) => m.DemoDashboard),
  { ssr: false, loading: () => <DemoDashboardSkeleton /> },
);

function DemoDashboardSkeleton() {
  return (
    <div className="w-full min-h-[1100px] sm:min-h-[950px]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-lg lg:col-span-2" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

function DemoDashboardLazyInner() {
  const [captureMode, setCaptureMode] = useState(false);

  useEffect(() => {
    setCaptureMode(new URLSearchParams(window.location.search).get("capture") === "1");
  }, []);

  if (captureMode) {
    return <DemoDashboard />;
  }

  return (
    <LazyMount rootMargin="600px 0px" fallback={<DemoDashboardSkeleton />}>
      <DemoDashboard />
    </LazyMount>
  );
}

export function DemoDashboardLazy() {
  return (
    <Suspense fallback={<DemoDashboardSkeleton />}>
      <DemoDashboardLazyInner />
    </Suspense>
  );
}
