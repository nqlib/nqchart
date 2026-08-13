/**
 * Legend focus — dim everything that is not the selected series.
 *
 * Selecting a legend entry used to restyle only the legend label: the plot
 * itself was never told, so on a busy chart the one gesture everybody reaches
 * for did nothing useful. This applies the selection to the marks.
 *
 * Dimming rather than hiding is deliberate. Removing the other series rescales
 * the axis, so every click makes the chart jump and the selected series changes
 * shape as you isolate it — you lose the comparison you opened the chart for.
 * Fading keeps the axis fixed and the context readable.
 *
 * **Every managed series is written explicitly, including the focused one.**
 * `setOption` merges by default, so a series faded by the previous selection
 * keeps that opacity when the next option simply omits it — select two entries
 * in a row and the whole chart ends up dimmed, with nothing in the new option
 * to explain why. Restoring by omission does not work; restoring has to be
 * stated.
 */

import type { EChartsOption } from "echarts";
import { isReferenceSeriesId } from "./nq-mark-event";
import { seriesMatchesLegendKey } from "./series-identity";

/** Low enough to recede, high enough to still read as context. */
const DIMMED = 0.16;

type Style = Record<string, unknown> | undefined;

type SeriesLike = {
  id?: unknown;
  name?: unknown;
  data?: unknown[];
  itemStyle?: Style;
  lineStyle?: Style;
  areaStyle?: Style;
  label?: Style;
  [key: string]: unknown;
};

type LegendFocus = {
  selected?: string | null;
  isClickable?: boolean;
};

function asArray(series: EChartsOption["series"]): SeriesLike[] {
  if (!series) return [];
  return (Array.isArray(series) ? series : [series]) as SeriesLike[];
}

/**
 * Set opacity on the style objects a series already has.
 *
 * `full` restores rather than omits — see the merge note above. The restored
 * value is whatever the freshly compiled option carried, so a deliberately
 * translucent area keeps its own opacity instead of being flattened to 1.
 */
function withOpacity(s: SeriesLike, dim: boolean): SeriesLike {
  const set = (style: Style): Style => {
    if (!style) return style;
    return { ...style, opacity: dim ? DIMMED : (style.opacity ?? 1) };
  };
  return {
    ...s,
    itemStyle: { ...(s.itemStyle ?? {}), opacity: dim ? DIMMED : (s.itemStyle?.opacity ?? 1) },
    ...(s.lineStyle ? { lineStyle: set(s.lineStyle) } : {}),
    ...(s.areaStyle ? { areaStyle: set(s.areaStyle) } : {}),
    ...(s.label ? { label: set(s.label) } : {}),
  };
}

/**
 * Pie, funnel and treemap put every legend key inside one series, so the
 * selection has to be applied per data item rather than per series.
 */
function focusItems(s: SeriesLike, selected: string | null): SeriesLike {
  if (!Array.isArray(s.data)) return s;
  let matched = false;
  const data = s.data.map((d) => {
    if (!d || typeof d !== "object" || Array.isArray(d)) return d;
    const item = d as { name?: unknown; itemStyle?: Style };
    const isSelected = selected != null && String(item.name ?? "") === selected;
    if (isSelected) matched = true;
    const dim = selected != null && !isSelected;
    return {
      ...item,
      itemStyle: { ...(item.itemStyle ?? {}), opacity: dim ? DIMMED : (item.itemStyle?.opacity ?? 1) },
    };
  });
  // Nothing matched — the key belongs to a different series, so leave this one
  // alone rather than fading a whole chart that had nothing to do with it.
  if (selected != null && !matched) return s;
  return { ...s, data };
}

export function withLegendFocus(
  option: EChartsOption,
  legend: LegendFocus | undefined,
): EChartsOption {
  // Only charts whose legend can actually focus are managed. Everything else
  // keeps its compiled styling untouched.
  if (!legend?.isClickable) return option;

  const series = asArray(option.series);
  if (series.length === 0) return option;

  const selected = legend.selected ?? null;

  // Does any series *own* this key? If so the selection is series-level;
  // otherwise it names a slice inside a single series.
  const seriesLevel =
    selected != null &&
    series.some((s) => seriesMatchesLegendKey(s.id, s.name, selected));
  const itemLevel = selected != null && !seriesLevel;

  return {
    ...option,
    series: series.map((s) => {
      if (!s || typeof s !== "object") return s;
      // Reference lines and bands are annotation, not data — never dimmed.
      if (isReferenceSeriesId(s.id)) return s;
      if (itemLevel || (selected == null && Array.isArray(s.data) && s.data.some(isNamedItem))) {
        return focusItems(s, selected);
      }
      return withOpacity(
        s,
        selected != null && !seriesMatchesLegendKey(s.id, s.name, selected),
      );
    }) as EChartsOption["series"],
  };
}

function isNamedItem(d: unknown): boolean {
  return Boolean(d) && typeof d === "object" && !Array.isArray(d) && "name" in (d as object);
}
