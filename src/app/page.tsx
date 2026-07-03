import type { Metadata } from "next";
import Link from "next/link";

import NQChartWordmark from "@/assets/logos/nqchart";
import { Badge } from "@/components/ui/badge";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { ChartGallery } from "@/components/landing/chart-gallery";
import { DemoDashboardLazy } from "@/components/landing/demo-dashboard-lazy";
import { FeatureCode } from "@/components/landing/feature-code";
import { InstallCommand } from "@/components/landing/install-command";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { SITE_DESCRIPTION, SITE_NAME } from "@/globals/constants/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export const dynamic = "force-static";
export const revalidate = 86400; // refresh daily for GitHub stars

const STATS = [
  { value: "12+", label: "Chart families" },
  { value: "Apache ECharts", label: "Render engine" },
  { value: "shadcn", label: "Registry install" },
  { value: "MIT", label: "License" },
];

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen w-full flex-col">
      <LandingHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <h1 className="sr-only">
            {SITE_NAME} — composable React charts for shadcn/ui dashboards
          </h1>
          <Badge variant="secondary" className="font-normal">
            Apache ECharts · shadcn registry
          </Badge>
          <NQChartWordmark
            width="280"
            height="60"
            className="text-foreground h-auto w-55 sm:w-70"
            role="img"
            aria-label={SITE_NAME}
          />
          <p className="text-muted-foreground max-w-xl text-base leading-relaxed text-balance">
            Composable React charts for dashboards and BI. Drop a compound{" "}
            <code className="text-foreground font-mono text-sm">{"<Bar />"}</code> into your app and
            own the source — no black-box wrapper.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <EnhancedButton asChild size="lg">
              <Link href="/docs">Browse the charts</Link>
            </EnhancedButton>
            <EnhancedButton asChild variant="outline" size="lg">
              <Link href="/docs/installation">Read the docs</Link>
            </EnhancedButton>
          </div>
          <InstallCommand className="mt-2 w-full max-w-md" />
        </section>

        {/* Trust strip */}
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-card flex flex-col gap-1 px-5 py-4">
              <span className="text-base font-semibold tracking-tight tabular-nums">{value}</span>
              <span className="text-muted-foreground text-xs">{label}</span>
            </div>
          ))}
        </section>

        {/* Live dashboard demo */}
        <section className="pt-20">
          <DemoDashboardLazy />
        </section>

        {/* Chart gallery — the primary "browse the charts" action */}
        <section className="pt-20">
          <ChartGallery />
        </section>

        {/* Compound API + features */}
        <section className="pt-20">
          <FeatureCode />
        </section>

        {/* Final CTA */}
        <section className="flex flex-col items-center gap-5 py-20 text-center">
          <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-balance">
            Start with a chart, ship a dashboard
          </h2>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            Every chart type is documented with a live preview and copyable source. Find the one you
            need and add it in a single command.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <EnhancedButton asChild size="lg">
              <Link href="/docs">Browse the charts</Link>
            </EnhancedButton>
            <EnhancedButton asChild variant="outline" size="lg">
              <Link
                href="https://github.com/ctesibius/nqchart"
                target="_blank"
                rel="noreferrer"
              >
                Star on GitHub
              </Link>
            </EnhancedButton>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
