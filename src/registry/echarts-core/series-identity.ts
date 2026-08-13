/**
 * ECharts series `id` is the config dataKey — except when two marks share one
 * key (composed `<Area dataKey="otd" />` + `<Line dataKey="otd" />`). Duplicate
 * ids throw `id duplicates: otd` at setOption. The second series takes
 * `${dataKey}__nq_<kind>`; click + legend isolate still resolve to dataKey.
 */

export type SeriesIdKind = "area" | "line" | "bar" | "whiskers";

const KIND_SUFFIX = /^(.+)__nq_(area|line|bar|whiskers)\d*$/;

export function dataKeyFromSeriesId(id: string): string {
  const m = id.match(KIND_SUFFIX);
  return m ? m[1]! : id;
}

export function seriesMatchesLegendKey(
  id: unknown,
  name: unknown,
  selected: string,
): boolean {
  const sid = typeof id === "string" ? id : "";
  const label = typeof name === "string" ? name : "";
  return dataKeyFromSeriesId(sid) === selected || sid === selected || label === selected;
}

type SeriesIdCarrier = {
  id?: unknown;
  type?: unknown;
  areaStyle?: unknown;
};

function kindFromSeries(s: SeriesIdCarrier): SeriesIdKind {
  if (s.type === "bar") return "bar";
  if (s.type === "custom") return "whiskers";
  if (s.areaStyle) return "area";
  return "line";
}

export function uniquifySeriesIds<T extends SeriesIdCarrier>(series: T[]): T[] {
  const used = new Set<string>();
  return series.map((s) => {
    const base = typeof s.id === "string" ? s.id : "";
    if (!base || base.startsWith("__")) {
      if (base) used.add(base);
      return s;
    }
    if (!used.has(base)) {
      used.add(base);
      return s;
    }
    const kind = kindFromSeries(s);
    let id = `${base}__nq_${kind}`;
    let n = 2;
    while (used.has(id)) {
      id = `${base}__nq_${kind}${n}`;
      n += 1;
    }
    used.add(id);
    return { ...s, id };
  });
}
