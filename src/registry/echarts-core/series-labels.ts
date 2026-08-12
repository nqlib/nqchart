/** Point labels on bar / line / area series. */

export function seriesLabelOption(
  showLabels?: boolean,
  labelFormatter?: (value: unknown) => string,
): Record<string, unknown> | undefined {
  if (!showLabels) return undefined;
  return {
    show: true,
    position: "top",
    formatter: labelFormatter
      ? (params: { value?: unknown }) => {
          const v = Array.isArray(params.value)
            ? params.value[params.value.length - 1]
            : params.value;
          return labelFormatter(v);
        }
      : undefined,
  };
}
