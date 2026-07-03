import { type ChartConfig } from "@/registry/ui/chart";
import { chartColorByIndex, chartConfigColor } from "@/registry/examples/chart-tokens";

/**
 * Mock SaaS revenue dataset for the homepage demo dashboard.
 * Twelve months of MRR, split into new / expansion / churned movement,
 * a plan mix snapshot, and a retention KPI. Numbers are internally
 * consistent (mrr ≈ prior mrr + new + expansion − churned) so the charts
 * tell one coherent story.
 */

export type MrrRow = {
  month: string;
  mrr: number;
  new: number;
  expansion: number;
  churned: number;
};

export const MRR_MONTHLY: MrrRow[] = [
  { month: "January", mrr: 41200, new: 5200, expansion: 1800, churned: 2100 },
  { month: "February", mrr: 46800, new: 6100, expansion: 2300, churned: 2800 },
  { month: "March", mrr: 52400, new: 7400, expansion: 2600, churned: 4400 },
  { month: "April", mrr: 58100, new: 8200, expansion: 3100, churned: 5600 },
  { month: "May", mrr: 63900, new: 8900, expansion: 3400, churned: 6500 },
  { month: "June", mrr: 71300, new: 10400, expansion: 4100, churned: 7100 },
  { month: "July", mrr: 76800, new: 9800, expansion: 3900, churned: 8200 },
  { month: "August", mrr: 84500, new: 11900, expansion: 4600, churned: 9000 },
  { month: "September", mrr: 91200, new: 11200, expansion: 5100, churned: 9600 },
  { month: "October", mrr: 99400, new: 13100, expansion: 5800, churned: 10700 },
  { month: "November", mrr: 108600, new: 14200, expansion: 6300, churned: 11100 },
  { month: "December", mrr: 117900, new: 15400, expansion: 6900, churned: 13000 },
];

/** Single-series MRR config (area trend). */
export const MRR_CONFIG = {
  mrr: {
    label: "MRR",
    colors: chartConfigColor(3),
  },
} satisfies ChartConfig;

/** New logo vs expansion MRR (stacked bar). */
export const MRR_COMPONENTS_CONFIG = {
  new: {
    label: "New logos",
    colors: chartConfigColor(1),
  },
  expansion: {
    label: "Expansion",
    colors: chartConfigColor(3),
  },
} satisfies ChartConfig;

/** New vs churned movement (composed bar + line). Kept for docs/examples that import it. */
export const MOVEMENT_CONFIG = {
  new: {
    label: "New + expansion",
    colors: chartConfigColor(1),
  },
  churned: {
    label: "Churned",
    colors: chartConfigColor(4),
  },
} satisfies ChartConfig;

/** Net-new movement derived from the dataset so both charts stay in sync. */
export const MOVEMENT_MONTHLY = MRR_MONTHLY.map((r) => ({
  month: r.month,
  new: r.new + r.expansion,
  churned: r.churned,
}));

/** Plan mix snapshot (pie). */
export const PLAN_MIX = [
  { plan: "starter", accounts: 1840 },
  { plan: "growth", accounts: 920 },
  { plan: "scale", accounts: 310 },
  { plan: "enterprise", accounts: 72 },
];

export const PLAN_MIX_CONFIG = {
  starter: { label: "Starter", colors: chartConfigColor(0) },
  growth: { label: "Growth", colors: chartConfigColor(1) },
  scale: { label: "Scale", colors: chartConfigColor(3) },
  enterprise: { label: "Enterprise", colors: chartConfigColor(2) },
} satisfies ChartConfig;

/**
 * Activation-rate gauge (radial semi). Kept on a 0–100 scale so the gauge
 * dial reads honestly — the NQRadialChart gauge defaults to min 0 / max 100.
 */
export const ACTIVATION_DATA = [{ series: "activation", value: 78 }];

export const ACTIVATION_CONFIG = {
  activation: {
    label: "Activated",
    colors: {
      light: [chartColorByIndex(3), chartColorByIndex(2)],
      dark: [chartColorByIndex(3), chartColorByIndex(2)],
    },
  },
} satisfies ChartConfig;

export function formatMonthTickShort(value: unknown) {
  return String(value).substring(0, 3);
}

export function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** KPI cards. Deltas are month-over-month against the demo dataset. */
export const KPIS = [
  { label: "Monthly recurring revenue", value: "$117.9k", delta: "+8.6%", trend: "up" as const },
  { label: "Net new MRR", value: "+$9.3k", delta: "+12.1%", trend: "up" as const },
  { label: "Net revenue retention", value: "112%", delta: "+1.4 pts", trend: "up" as const },
  { label: "Gross churn", value: "11.0%", delta: "+0.9 pts", trend: "down" as const },
];
