/**
 * Normalize stacked series values to 0–100% per category row.
 * Used when `cartesian.stackType === "percent"` with `yAxis.max: 100`.
 */
export function normalizeStackPercent(
  data: Record<string, unknown>[],
  keys: string[],
): Record<string, unknown>[] {
  return data.map((row) => {
    const total = keys.reduce((sum, key) => sum + Number(row[key] ?? 0), 0);
    if (total <= 0) return row;
    const next = { ...row };
    for (const key of keys) {
      next[key] = (Number(row[key] ?? 0) / total) * 100;
    }
    return next;
  });
}
