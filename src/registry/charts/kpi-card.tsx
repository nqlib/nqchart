"use client";

import { Fill, NQSparklineChart, Sparkline } from "@/registry/charts/sparkline-chart";
import { cn } from "@/registry/lib/cn";
import type { ChartConfig } from "@/registry/ui/chart";

// ---------------------------------------------------------------------------
// Pure helpers — exported so the delta math and tone logic are unit-tested.
// ---------------------------------------------------------------------------

export type KpiDeltaFormat = "percent" | "absolute";
export type KpiDirection = "up" | "down" | "flat";
export type KpiTone = "positive" | "negative" | "neutral";

export type KpiDelta = {
  /** Signed change. Percent is a fraction (0.124 = 12.4%); absolute is in value units. */
  value: number;
  /** Format actually used — a percent change from 0 falls back to absolute. */
  format: KpiDeltaFormat;
  direction: KpiDirection;
};

/** A percent change that rounds to 0.0% reads as flat, not as a tiny arrow. */
const PERCENT_FLAT_EPSILON = 0.0005;

/** `up` / `down` / `flat` for a signed delta in the given format. */
export function kpiDirection(delta: number, format: KpiDeltaFormat): KpiDirection {
  if (!Number.isFinite(delta)) return "flat";
  const epsilon = format === "percent" ? PERCENT_FLAT_EPSILON : 0;
  if (Math.abs(delta) <= epsilon) return "flat";
  return delta > 0 ? "up" : "down";
}

/**
 * Resolve the delta shown on the card. An explicit `delta` wins; otherwise it is
 * derived from `previousValue`. Returns `null` when there is nothing to compare.
 *
 * Percent change is `(value - previous) / |previous|`, so a move from -10 to -5
 * reads as +50% (an improvement), not -50%. A percent change from 0 is
 * undefined: it falls back to the absolute change instead of printing ∞.
 */
export function resolveKpiDelta({
  value,
  previousValue,
  delta,
  deltaFormat = "percent",
}: {
  value: number;
  previousValue?: number;
  delta?: number;
  deltaFormat?: KpiDeltaFormat;
}): KpiDelta | null {
  if (delta !== undefined) {
    if (!Number.isFinite(delta)) return null;
    return { value: delta, format: deltaFormat, direction: kpiDirection(delta, deltaFormat) };
  }
  if (previousValue === undefined || !Number.isFinite(previousValue) || !Number.isFinite(value)) {
    return null;
  }
  const change = value - previousValue;
  if (deltaFormat === "absolute" || previousValue === 0) {
    return { value: change, format: "absolute", direction: kpiDirection(change, "absolute") };
  }
  const pct = change / Math.abs(previousValue);
  return { value: pct, format: "percent", direction: kpiDirection(pct, "percent") };
}

/** Good / bad / neutral for a direction. `higherIsBetter=false` inverts (churn, cost, latency). */
export function kpiTone(direction: KpiDirection, higherIsBetter = true): KpiTone {
  if (direction === "flat") return "neutral";
  const good = direction === "up" ? higherIsBetter : !higherIsBetter;
  return good ? "positive" : "negative";
}

/** Default value formatter: grouped digits, up to two decimals. */
export function formatKpiNumber(value: number, locale?: string): string {
  return value.toLocaleString(locale, { maximumFractionDigits: 2 });
}

/**
 * Unsigned delta magnitude — the arrow glyph carries the sign.
 * Percent: `12.4%`. Absolute: the card's `formatValue` applied to `|delta|`.
 */
export function formatKpiDelta(
  delta: KpiDelta,
  formatValue: (value: number) => string = formatKpiNumber,
  locale?: string,
): string {
  const magnitude = Math.abs(delta.value);
  if (delta.format === "percent") {
    return magnitude.toLocaleString(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    });
  }
  return formatValue(magnitude);
}

/** Share of target reached, clamped to [0, 1]. `null` when the target is not positive. */
export function kpiProgress(value: number, target: number): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return null;
  return Math.min(1, Math.max(0, value / target));
}

/** One-sentence summary for assistive tech: "Revenue: $1.2M, up 12.4% vs last month (favorable)". */
export function kpiAriaLabel({
  label,
  formattedValue,
  delta,
  formattedDelta,
  tone,
  comparisonLabel,
  progress,
  formattedTarget,
}: {
  label: string;
  formattedValue: string;
  delta: KpiDelta | null;
  formattedDelta?: string;
  tone?: KpiTone;
  comparisonLabel?: string;
  progress?: number | null;
  formattedTarget?: string;
}): string {
  let text = `${label}: ${formattedValue}`;
  if (delta && formattedDelta !== undefined) {
    const verb = delta.direction === "up" ? "up" : delta.direction === "down" ? "down" : "unchanged";
    text += delta.direction === "flat" ? `, ${verb}` : `, ${verb} ${formattedDelta}`;
    if (comparisonLabel) text += ` ${comparisonLabel}`;
    if (tone === "positive") text += " (favorable)";
    else if (tone === "negative") text += " (unfavorable)";
  }
  if (progress !== null && progress !== undefined && formattedTarget !== undefined) {
    text += `, ${Math.round(progress * 100)}% of target ${formattedTarget}`;
  }
  return text;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DIRECTION_GLYPH: Record<KpiDirection, string> = { up: "↑", down: "↓", flat: "→" };

/**
 * Semantic delta colours. 700 on a 10% tint (light) and 400 on a 10% tint (dark)
 * both clear 4.5:1 on a card surface; neutral uses the muted tokens.
 */
const TONE_CLASS: Record<KpiTone, string> = {
  positive:
    "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400",
  negative: "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400",
  neutral: "bg-muted text-muted-foreground",
};

const SPARK_KEY = "kpi";

export type NQKpiCardProps<TData extends Record<string, unknown> = Record<string, unknown>> = {
  /** Metric name, shown above the value and used in the accessible summary. */
  label: string;
  value: number;
  /** Formats the value, the target, and absolute deltas. Defaults to grouped digits. */
  formatValue?: (value: number) => string;
  /** Comparison-period value; the delta is derived from it. */
  previousValue?: number;
  /** Explicit delta (overrides `previousValue`). Percent is a fraction: `0.124` = 12.4%. */
  delta?: number;
  /** @default "percent" */
  deltaFormat?: KpiDeltaFormat;
  /** `true` → up is good (green). `false` → down is good (churn, cost). Flat is muted. @default true */
  higherIsBetter?: boolean;
  /** Text after the delta, e.g. `"vs last month"`. */
  comparisonLabel?: string;
  /** Draws a progress track toward this target (value / target, clamped). */
  target?: number;
  /** Inline trend values. Shorthand for `data` + `dataKey`. */
  sparkline?: number[];
  /** Rows for the embedded sparkline (with `dataKey`). */
  data?: TData[];
  /** Numeric field of `data` plotted by the sparkline. */
  dataKey?: keyof TData & string;
  /** Sparkline stroke and progress fill. Any CSS colour; theme vars adapt to dark mode. @default "var(--chart-1)" */
  color?: string;
  isLoading?: boolean;
  /** Shows an em dash and "No data" instead of the value. Also implied by a non-finite value. */
  isEmpty?: boolean;
  className?: string;
};

function KpiSkeleton({ className, label }: { className?: string; label: string }) {
  return (
    <div
      data-slot="kpi-card"
      aria-busy="true"
      aria-label={`${label}: loading`}
      role="group"
      className={cn(
        "bg-card text-card-foreground flex min-w-0 flex-col gap-3 rounded-xl border p-4",
        className,
      )}
    >
      <div className="bg-muted h-3.5 w-20 rounded-sm motion-safe:animate-pulse" />
      <div className="bg-muted h-7 w-28 rounded-sm motion-safe:animate-pulse" />
      <div className="bg-muted h-3 w-24 rounded-sm motion-safe:animate-pulse" />
    </div>
  );
}

export function NQKpiCard<TData extends Record<string, unknown> = Record<string, unknown>>({
  label,
  value,
  formatValue = formatKpiNumber,
  previousValue,
  delta: deltaOverride,
  deltaFormat = "percent",
  higherIsBetter = true,
  comparisonLabel,
  target,
  sparkline,
  data,
  dataKey,
  color = "var(--chart-1)",
  isLoading = false,
  isEmpty = false,
  className,
}: NQKpiCardProps<TData>) {
  if (isLoading) return <KpiSkeleton className={className} label={label} />;

  const empty = isEmpty || !Number.isFinite(value);
  const formattedValue = empty ? "—" : formatValue(value);
  const delta = empty
    ? null
    : resolveKpiDelta({ value, previousValue, delta: deltaOverride, deltaFormat });
  const tone = delta ? kpiTone(delta.direction, higherIsBetter) : "neutral";
  const formattedDelta = delta ? formatKpiDelta(delta, formatValue) : undefined;
  const progress = !empty && target !== undefined ? kpiProgress(value, target) : null;
  const formattedTarget = target !== undefined ? formatValue(target) : undefined;

  const sparkRows: Record<string, unknown>[] | null = empty
    ? null
    : sparkline && sparkline.length > 1
      ? sparkline.map((v) => ({ value: v }))
      : data && dataKey && data.length > 1
        ? data
        : null;
  const sparkValueKey = sparkline ? "value" : (dataKey ?? "value");
  const sparkConfig = {
    [SPARK_KEY]: { label, colors: { light: [color], dark: [color] } },
  } satisfies ChartConfig;

  const ariaLabel = empty
    ? `${label}: no data`
    : kpiAriaLabel({
        label,
        formattedValue,
        delta,
        formattedDelta,
        tone,
        comparisonLabel,
        progress,
        formattedTarget,
      });

  return (
    <div
      data-slot="kpi-card"
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "@container bg-card text-card-foreground flex min-w-0 flex-col gap-3 rounded-xl border p-4",
        className,
      )}
    >
      <div className="text-muted-foreground truncate text-sm font-medium">{label}</div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <div
          className={cn(
            "truncate font-mono text-2xl leading-none font-semibold tracking-tight tabular-nums @2xs:text-3xl",
            empty && "text-muted-foreground",
          )}
        >
          {formattedValue}
        </div>

        {empty ? (
          <div className="text-muted-foreground text-xs">No data</div>
        ) : delta ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            <span
              data-tone={tone}
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono font-medium tabular-nums",
                TONE_CLASS[tone],
              )}
            >
              <span aria-hidden="true">{DIRECTION_GLYPH[delta.direction]}</span>
              {formattedDelta}
            </span>
            {comparisonLabel ? (
              <span className="text-muted-foreground truncate">{comparisonLabel}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {progress !== null && formattedTarget !== undefined ? (
        <div className="flex flex-col gap-1.5">
          <div
            role="progressbar"
            aria-label={`${label} progress to target`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="bg-muted h-1.5 w-full overflow-hidden rounded-sm"
          >
            <div
              className="h-full rounded-sm"
              style={{ width: `${progress * 100}%`, backgroundColor: color }}
            />
          </div>
          <div className="text-muted-foreground flex justify-between gap-2 text-xs">
            <span className="font-mono tabular-nums">{Math.round(progress * 100)}%</span>
            <span className="truncate">
              of <span className="font-mono tabular-nums">{formattedTarget}</span>
            </span>
          </div>
        </div>
      ) : null}

      {sparkRows ? (
        <div className="-mx-1 -mb-1" aria-hidden="true">
          <NQSparklineChart
            data={sparkRows}
            config={sparkConfig}
            valueDataKey={sparkValueKey}
            className="h-10 w-full"
          >
            <Fill dataKey={SPARK_KEY} />
            <Sparkline dataKey={SPARK_KEY} />
          </NQSparklineChart>
        </div>
      ) : null}
    </div>
  );
}
