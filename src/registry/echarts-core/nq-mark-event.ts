/**
 * Public mark-interaction payload — one event shape for click and keyboard Enter.
 * `category` is the raw axis / row value (not the tick label) so boards can filter.
 */

import { dataKeyFromSeriesId } from "./series-identity";

export type NQMarkEventModifiers = {
  shift: boolean;
  meta: boolean;
  alt: boolean;
  ctrl: boolean;
};

export type NQMarkEvent = {
  /** Raw category / x value from the datum (or nameKey for pie/funnel/treemap). */
  category: unknown;
  /** Display label when different from `category` (optional). */
  categoryLabel?: string;
  /** Series `dataKey`, or slice id (raw `nameKey` value) for pie / funnel / treemap. */
  seriesKey: string;
  /** Raw datum for the mark. */
  datum: Record<string, unknown>;
  value: number | null;
  /** Index into the root `data` array (absolute — not brush-window relative). */
  index: number;
  /** Modifier state — BI boards use shift/ctrl to extend a selection. */
  modifiers: NQMarkEventModifiers;
};

export type EChartsMarkClickParams = {
  componentType?: string;
  componentSubType?: string;
  seriesType?: string;
  seriesName?: string;
  seriesId?: string;
  seriesIndex?: number;
  dataIndex?: number;
  name?: string;
  value?: unknown;
  data?: unknown;
  event?: {
    event?: {
      shiftKey?: boolean;
      metaKey?: boolean;
      altKey?: boolean;
      ctrlKey?: boolean;
    };
  };
};

const REFERENCE_SERIES_ID = "__nq_reference__";
const NQ_SERIES_KEY = "__nq_seriesKey";
const NQ_DATUM = "__nq_datum";

export function isReferenceSeriesId(id: unknown): boolean {
  return id === REFERENCE_SERIES_ID || (typeof id === "string" && id.startsWith("__nq_reference"));
}

export { REFERENCE_SERIES_ID, NQ_SERIES_KEY, NQ_DATUM };

function modifiersFromParams(params: EChartsMarkClickParams): NQMarkEventModifiers {
  const e = params.event?.event;
  return {
    shift: Boolean(e?.shiftKey),
    meta: Boolean(e?.metaKey),
    alt: Boolean(e?.altKey),
    ctrl: Boolean(e?.ctrlKey),
  };
}

function numberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (Array.isArray(value)) {
    const last = value[value.length - 1];
    return numberOrNull(last);
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    return numberOrNull((value as { value: unknown }).value);
  }
  return null;
}

function asDatum(
  data: unknown,
  absoluteIndex: number,
  rows: Record<string, unknown>[],
): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const row = data as Record<string, unknown>;
    const embedded = row[NQ_DATUM];
    if (embedded && typeof embedded === "object" && !Array.isArray(embedded)) {
      return embedded as Record<string, unknown>;
    }
    if (absoluteIndex >= 0 && absoluteIndex < rows.length) {
      return rows[absoluteIndex]!;
    }
    return row;
  }
  if (absoluteIndex >= 0 && absoluteIndex < rows.length) {
    return rows[absoluteIndex]!;
  }
  return {};
}

export type MapMarkClickOptions = {
  data: Record<string, unknown>[];
  /** Category / x field on each row. */
  xDataKey?: string;
  /** For pie/funnel — field used as the slice name. */
  nameKey?: string;
  /** Pie/funnel numeric field (default `value`). */
  valueKey?: string;
  /**
   * Added to ECharts `dataIndex` so the event index addresses the root `data`
   * array when the plot is a brush window.
   */
  indexOffset?: number;
  /** Map ECharts seriesName → config dataKey when labels differ. */
  seriesKeyFromName?: (seriesName: string | undefined) => string | undefined;
  modifiers?: Partial<NQMarkEventModifiers>;
};

/**
 * Map an ECharts `click` params object to {@link NQMarkEvent}.
 * Returns null for non-series clicks, reference marks, or null values.
 */
export function mapEChartsClickToMarkEvent(
  params: EChartsMarkClickParams,
  opts: MapMarkClickOptions,
): NQMarkEvent | null {
  if (params.componentType !== "series") return null;
  if (isReferenceSeriesId(params.seriesId)) return null;
  // Waterfall transparent stack must never fire.
  if (params.seriesName === "__wf_placeholder__" || params.seriesId === "__wf_placeholder__") {
    return null;
  }
  if (typeof params.dataIndex !== "number" || params.dataIndex < 0) return null;

  const indexOffset = opts.indexOffset ?? 0;
  const index = params.dataIndex + indexOffset;
  const datum = asDatum(params.data, index, opts.data);
  const hasEmbeddedDatum =
    params.data &&
    typeof params.data === "object" &&
    !Array.isArray(params.data) &&
    (params.data as Record<string, unknown>)[NQ_DATUM] != null;

  const embeddedKey =
    params.data &&
    typeof params.data === "object" &&
    !Array.isArray(params.data) &&
    typeof (params.data as Record<string, unknown>)[NQ_SERIES_KEY] === "string"
      ? String((params.data as Record<string, unknown>)[NQ_SERIES_KEY])
      : undefined;

  // Prefer stable series `id` (= dataKey) over display `seriesName` / label.
  const seriesId =
    typeof params.seriesId === "string" &&
    params.seriesId &&
    !isReferenceSeriesId(params.seriesId) &&
    !params.seriesId.startsWith("__wf_")
      ? params.seriesId
      : undefined;

  let seriesKey = "";
  if (embeddedKey) {
    seriesKey = embeddedKey;
  } else if (seriesId) {
    seriesKey = dataKeyFromSeriesId(seriesId);
  } else if (opts.nameKey) {
    // Pie / funnel: slice identity is the raw nameKey value, not the series name.
    const sliceId = datum[opts.nameKey];
    if (sliceId != null && sliceId !== "") {
      seriesKey = String(sliceId);
    } else {
      seriesKey =
        opts.seriesKeyFromName?.(params.name) ??
        (typeof params.name === "string" ? params.name : "") ??
        "";
    }
  } else {
    seriesKey =
      opts.seriesKeyFromName?.(params.seriesName) ??
      params.seriesName ??
      "";
  }

  if (!seriesKey) return null;

  const valueKey = opts.valueKey ?? "value";
  const valueFromDatum = opts.nameKey
    ? numberOrNull(datum[valueKey] ?? datum[seriesKey])
    : numberOrNull(datum[seriesKey] ?? datum[valueKey]);

  // Embedded source rows win over ECharts display values (e.g. waterfall stack height).
  const resolvedValue = hasEmbeddedDatum
    ? (valueFromDatum ?? numberOrNull(params.value) ?? null)
    : (numberOrNull(params.value) ?? valueFromDatum ?? null);

  // Null / missing marks do not fire.
  if (resolvedValue == null) {
    const raw = opts.nameKey
      ? datum[valueKey] ?? datum[seriesKey]
      : datum[seriesKey] ?? datum[valueKey];
    if (raw == null || raw === "") return null;
  }

  const categoryKey = opts.xDataKey ?? opts.nameKey;
  const category =
    categoryKey != null && categoryKey in datum
      ? datum[categoryKey]
      : (params.name ?? index);

  return {
    category,
    categoryLabel: typeof params.name === "string" ? params.name : undefined,
    seriesKey,
    datum,
    value: resolvedValue,
    index,
    modifiers: {
      ...modifiersFromParams(params),
      ...opts.modifiers,
    },
  };
}
