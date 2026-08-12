/**
 * Resolve a display name (ECharts seriesName / slice label) back to a ChartConfig key.
 * Shared by tooltip formatting and mark-click mapping.
 */

import type { ChartConfig } from "@/registry/ui/chart";

export function configKeyFromDisplayName(name: string, config: ChartConfig): string {
  if (name in config) return name;
  for (const [key, entry] of Object.entries(config)) {
    if (entry.label?.toString() === name) return key;
  }
  return name;
}
