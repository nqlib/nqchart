"use client";

import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/registry/ui/chart";
import type { ReactNode } from "react";

const A11Y_TABLE_ROW_CAP = 500;

export function ChartEmptyState({ children }: { children?: ReactNode }) {
  return (
    <div
      className="absolute inset-0 z-[2] flex items-center justify-center bg-background/80"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-muted-foreground">{children ?? "No data"}</p>
    </div>
  );
}

export function ChartErrorState({ children }: { children?: ReactNode }) {
  return (
    <div
      className="absolute inset-0 z-[2] flex items-center justify-center bg-background/90"
      role="alert"
    >
      <div className="max-w-sm px-4 text-center text-sm text-destructive">
        {children ?? "Something went wrong loading this chart."}
      </div>
    </div>
  );
}

export function ChartA11yTable({
  config,
  data,
  seriesKeys,
  categoryKey,
  label,
  summary,
  className,
}: {
  config: ChartConfig;
  data: Record<string, unknown>[];
  seriesKeys: string[];
  categoryKey?: string;
  label?: string;
  summary?: string;
  className?: string;
}) {
  if (!data.length || !seriesKeys.length) return null;
  const rows = data.slice(0, A11Y_TABLE_ROW_CAP);
  const truncated = data.length > A11Y_TABLE_ROW_CAP;

  return (
    <div className={cn("sr-only", className)}>
      {label ? <p>{label}</p> : null}
      {summary ? <p>{summary}</p> : null}
      <table>
        <caption>
          Chart data
          {truncated ? ` (first ${A11Y_TABLE_ROW_CAP} of ${data.length} rows)` : ""}
        </caption>
        <thead>
          <tr>
            {categoryKey ? <th scope="col">{categoryKey}</th> : <th scope="col">Index</th>}
            {seriesKeys.map((key) => (
              <th key={key} scope="col">
                {config[key]?.label?.toString() ?? key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <th scope="row">
                {categoryKey != null ? String(row[categoryKey] ?? i) : String(i)}
              </th>
              {seriesKeys.map((key) => (
                <td key={key}>{row[key] == null ? "" : String(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function deriveSeriesKeysFromConfig(
  config: ChartConfig,
  data: Record<string, unknown>[],
  categoryKey?: string,
): string[] {
  const fromConfig = Object.keys(config).filter((k) => k !== categoryKey);
  if (fromConfig.length) return fromConfig;
  if (!data[0]) return [];
  return Object.keys(data[0]).filter((k) => k !== categoryKey);
}

export { A11Y_TABLE_ROW_CAP };
