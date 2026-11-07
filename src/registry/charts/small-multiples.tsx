"use client";

import { cn } from "@/registry/lib/cn";
import { ChartStyle, type ChartConfig, getColorsCount } from "@/registry/ui/chart";
import { useId, type CSSProperties, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Pure helpers — exported so grouping and the shared domain are unit-tested.
// ---------------------------------------------------------------------------

export type SmallMultipleGroup<TData> = { key: string; rows: TData[] };

/** Split rows by `facetKey`, keeping facets in first-appearance order and rows in input order. */
export function groupByFacet<TData extends Record<string, unknown>>(
  data: readonly TData[],
  facetKey: string,
): SmallMultipleGroup<TData>[] {
  const groups = new Map<string, TData[]>();
  for (const row of data) {
    const raw = row[facetKey];
    if (raw === undefined || raw === null) continue;
    const key = String(raw);
    const rows = groups.get(key);
    if (rows) rows.push(row);
    else groups.set(key, [row]);
  }
  return Array.from(groups, ([key, rows]) => ({ key, rows }));
}

/** Every key (except `facetKey`) that holds a finite number in at least one row. */
export function inferValueKeys(data: readonly Record<string, unknown>[], facetKey: string): string[] {
  const keys = new Set<string>();
  for (const row of data) {
    for (const [key, v] of Object.entries(row)) {
      if (key !== facetKey && typeof v === "number" && Number.isFinite(v)) keys.add(key);
    }
  }
  return Array.from(keys);
}

/** Round a step up to 1, 2, 2.5 or 5 × 10ⁿ. */
function niceStep(rawStep: number): number {
  const exp = Math.floor(Math.log10(rawStep));
  const base = 10 ** exp;
  const f = rawStep / base;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * base;
}

/** Widen `[min, max]` outward to round tick values (~`tickCount` intervals). */
export function niceDomain(min: number, max: number, tickCount = 5): [number, number] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    if (min === 0) return [0, 1];
    const pad = Math.abs(min) * 0.1;
    return niceDomain(min - pad, max + pad, tickCount);
  }
  const step = niceStep((max - min) / Math.max(1, tickCount));
  // Round away float noise (0.30000000000000004) before snapping.
  const lo = Number((Math.floor(min / step) * step).toPrecision(12));
  const hi = Number((Math.ceil(max / step) * step).toPrecision(12));
  return [lo, hi];
}

/**
 * One y-domain across every facet so heights compare honestly.
 * Scans `valueKeys` of every row; `includeZero` (default) anchors bars at 0;
 * `nice` (default) rounds the edges to tick-friendly values.
 * Returns `null` when no finite value exists.
 */
export function computeSharedDomain(
  data: readonly Record<string, unknown>[],
  valueKeys: readonly string[],
  { includeZero = true, nice = true }: { includeZero?: boolean; nice?: boolean } = {},
): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (const row of data) {
    for (const key of valueKeys) {
      const v = row[key];
      if (typeof v !== "number" || !Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (min === Infinity) return null;
  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  return nice ? niceDomain(min, max) : [min, max];
}

/**
 * CSS `grid-template-columns` for the facet grid. With no `columns`, as many
 * `minFacetWidth` tracks as fit. With `columns`, that many at most — narrower
 * containers wrap to fewer so facets never shrink below `minFacetWidth`.
 */
export function smallMultiplesGridTemplate(
  columns: number | undefined,
  minFacetWidth: number,
  gap: string,
): string {
  const min = `min(100%, ${minFacetWidth}px)`;
  if (!columns || columns < 1) return `repeat(auto-fill, minmax(${min}, 1fr))`;
  const n = Math.floor(columns);
  // `n` gaps (not n - 1) leaves one gap of slack so float rounding never drops a column.
  const share = `calc((100% - ${n} * ${gap}) / ${n})`;
  return `repeat(auto-fill, minmax(max(${min}, ${share}), 1fr))`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type SmallMultipleFacet<TData> = {
  /** Facet value (stringified `row[facetKey]`). */
  key: string;
  index: number;
  rows: TData[];
  /** Shared y-domain — pass to `<YAxis domain={facet.domain} />`. `undefined` when `sharedYDomain` is off. */
  domain: [number, number] | undefined;
};

export type NQSmallMultiplesProps<TData extends Record<string, unknown>> = {
  data: TData[];
  /** Field that splits rows into facets. */
  facetKey: keyof TData & string;
  /** Renders one chart per facet. Pin the axis with `facet.domain`. */
  children: (rows: TData[], facet: SmallMultipleFacet<TData>) => ReactNode;
  /** Same y-domain on every facet. @default true */
  sharedYDomain?: boolean;
  /** Fields scanned for the shared domain. Defaults to every numeric field except `facetKey`. */
  valueKeys?: (keyof TData & string)[];
  /** Anchor the shared domain at zero (bars). Turn off for lines far from zero. @default true */
  includeZero?: boolean;
  /** Maximum columns. Omit to fit as many `minFacetWidth` columns as the container allows. */
  columns?: number;
  /** Narrowest a facet may get before the grid wraps. @default 220 */
  minFacetWidth?: number;
  /** Height of every facet's chart area (px or CSS length). @default 160 */
  facetHeight?: number | string;
  /** Facet title. Defaults to the facet key. */
  facetLabel?: (facet: SmallMultipleFacet<TData>) => ReactNode;
  /** Series config for the one shared legend (each facet chart omits its own `<Legend />`). */
  config?: ChartConfig;
  /** Show the shared legend. `true` lists every `config` key; pass keys to choose. @default false */
  legend?: boolean | string[];
  /** Gap between facets (CSS length). @default 8 × `--chart-gap` (16px) */
  gap?: string;
  className?: string;
};

function SharedLegend({ config, keys }: { config: ChartConfig; keys: string[] }) {
  const id = `small-multiples-${useId().replace(/:/g, "")}`;
  return (
    <div
      data-chart={id}
      className="text-foreground flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs select-none"
    >
      <ChartStyle id={id} config={config} />
      {keys.map((key) => {
        const item = config[key];
        if (!item) return null;
        const count = getColorsCount(item);
        const fill: CSSProperties =
          count <= 1
            ? { backgroundColor: `var(--color-${key}-0)` }
            : {
                background: `linear-gradient(to right, ${Array.from(
                  { length: count },
                  (_, i) => `var(--color-${key}-${i}) ${(i / (count - 1)) * 100}%`,
                ).join(", ")})`,
              };
        return (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={fill} />
            {item.label ?? key}
          </div>
        );
      })}
    </div>
  );
}

export function NQSmallMultiples<TData extends Record<string, unknown>>({
  data,
  facetKey,
  children,
  sharedYDomain = true,
  valueKeys,
  includeZero = true,
  columns,
  minFacetWidth = 220,
  facetHeight = 160,
  facetLabel,
  config,
  legend = false,
  gap = "calc(var(--chart-gap, 2px) * 8)",
  className,
}: NQSmallMultiplesProps<TData>) {
  const groups = groupByFacet(data, facetKey);
  const domain = sharedYDomain
    ? (computeSharedDomain(data, valueKeys ?? inferValueKeys(data, facetKey), { includeZero }) ??
      undefined)
    : undefined;
  const legendKeys = config && legend ? (legend === true ? Object.keys(config) : legend) : [];

  if (groups.length === 0) {
    return (
      <div
        data-slot="small-multiples"
        className={cn(
          "text-muted-foreground flex min-h-24 w-full items-center justify-center text-sm",
          className,
        )}
      >
        No data
      </div>
    );
  }

  return (
    <div data-slot="small-multiples" className={cn("flex w-full min-w-0 flex-col", className)} style={{ gap }}>
      {config && legendKeys.length > 0 ? <SharedLegend config={config} keys={legendKeys} /> : null}
      <div
        className="grid w-full min-w-0"
        style={{ gap, gridTemplateColumns: smallMultiplesGridTemplate(columns, minFacetWidth, gap) }}
      >
        {groups.map((group, index) => {
          const facet: SmallMultipleFacet<TData> = { key: group.key, index, rows: group.rows, domain };
          return (
            <figure key={group.key} data-facet={group.key} className="m-0 flex min-w-0 flex-col gap-1.5">
              <figcaption className="text-muted-foreground truncate text-xs font-medium">
                {facetLabel ? facetLabel(facet) : group.key}
              </figcaption>
              <div className="flex min-h-0 w-full flex-col" style={{ height: facetHeight }}>
                {children(group.rows, facet)}
              </div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
