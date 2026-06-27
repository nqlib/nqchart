"use client";

import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/nqui-card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { BeeAreaChart, Area, Grid, XAxis, Tooltip } from "@/registry/charts/area-chart";
import {
  BeeBarChart,
  Bar,
  Grid as BarGrid,
  XAxis as BarXAxis,
  Legend as BarLegend,
  Tooltip as BarTooltip,
} from "@/registry/charts/bar-chart";
import { BeePieChart, Pie, Tooltip as PieTooltip } from "@/registry/charts/pie-chart";
import { BeeRadialChart, RadialBar, Tooltip as RadialTooltip } from "@/registry/charts/radial-chart";

import {
  ACTIVATION_CONFIG,
  ACTIVATION_DATA,
  KPIS,
  MRR_COMPONENTS_CONFIG,
  MRR_CONFIG,
  MRR_MONTHLY,
  PLAN_MIX,
  PLAN_MIX_CONFIG,
  formatMonthTickShort,
} from "./dashboard-data";

/* ----------------------------- building blocks ---------------------------- */

function KpiCard({
  label,
  value,
  delta,
  trend,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
}) {
  const positive = trend === "up";
  return (
    <Card className="p-4">
      <div className="space-y-0.5">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <div className="flex items-end justify-between">
        <span className="text-xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span
          className={cn(
            "flex items-center gap-0.5 text-xs font-medium tabular-nums",
            positive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400",
          )}
        >
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {delta}
        </span>
        </div>
      </div>
    </Card>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-wide uppercase">
      {children}
    </h3>
  );
}

function ChartCard({
  title,
  description,
  bodyHeight,
  center = false,
  className,
  children,
}: {
  title: string;
  description: string;
  bodyHeight: string;
  center?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="space-y-0.5 p-4 pb-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardHeader>
      <CardContent
        className={cn("p-0", bodyHeight, center && "flex items-center justify-center")}
      >
        {children}
      </CardContent>
    </Card>
  );
}

/* -------------------------------- dashboard ------------------------------- */

const RANGES = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "12m", label: "12M" },
];

export function DemoDashboard() {
  const [range, setRange] = useState("12m");

  return (
    <section className="w-full">
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Revenue overview</h2>
            <Badge variant="secondary" className="font-normal">
              Interactive demo
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Recurring revenue and account health — every chart rendered with BeeCharts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(next) => next && setRange(next)}
            variant="outline"
            size="sm"
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <ToggleGroupItem key={r.value} value={r.value} aria-label={`Last ${r.label}`}>
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Growth */}
      <div className="mt-6">
        <SectionLabel>Growth</SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard
            title="Monthly recurring revenue"
            description="Net MRR after expansion and churn"
            bodyHeight="h-80"
            className="lg:col-span-2"
          >
            <BeeAreaChart
              data={MRR_MONTHLY}
              config={MRR_CONFIG}
              xDataKey="month"
              className="h-full w-full p-4"
              brushFormatLabel={formatMonthTickShort}
            >
              <Grid />
              <XAxis dataKey="month" tickFormatter={formatMonthTickShort} />
              <Tooltip />
              <Area dataKey="mrr" />
            </BeeAreaChart>
          </ChartCard>

          <ChartCard
            title="Activation rate"
            description="New accounts reaching first value"
            bodyHeight="h-80"
            center
          >
            <BeeRadialChart
              data={ACTIVATION_DATA}
              config={ACTIVATION_CONFIG}
              nameKey="series"
              variant="semi"
              className="h-full w-full p-4"
            >
              <RadialTooltip />
              <RadialBar dataKey="value" />
            </BeeRadialChart>
          </ChartCard>
        </div>
      </div>

      {/* Movement & breakdown */}
      <div className="mt-6">
        <SectionLabel>Movement &amp; breakdown</SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard
            title="Net new MRR"
            description="New logo and expansion revenue stacked by month"
            bodyHeight="h-72"
            className="lg:col-span-2"
          >
            <BeeBarChart
              data={MRR_MONTHLY}
              config={MRR_COMPONENTS_CONFIG}
              xDataKey="month"
              stackType="stacked"
              barRadius={6}
              className="h-full w-full p-4"
            >
              <BarGrid />
              <BarXAxis dataKey="month" tickFormatter={formatMonthTickShort} />
              <BarLegend />
              <BarTooltip />
              <Bar dataKey="new" />
              <Bar dataKey="expansion" />
            </BeeBarChart>
          </ChartCard>

          <ChartCard
            title="Plan mix"
            description="Active accounts by plan"
            bodyHeight="h-72"
            center
          >
            <BeePieChart
              data={PLAN_MIX}
              config={PLAN_MIX_CONFIG}
              nameKey="plan"
              className="h-full w-full p-4"
            >
              <PieTooltip />
              <Pie dataKey="accounts" nameKey="plan" innerRadius="45%" />
            </BeePieChart>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
