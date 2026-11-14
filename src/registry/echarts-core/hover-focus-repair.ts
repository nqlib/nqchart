/**
 * Hover-focus repair — ONE module for every family whose ECharts high-down pipeline
 * is wrong, and ONE entry point (`focusMark` / `clearFocus`) for pointer hover and
 * keyboard focus so all of them look identical.
 *
 * Contract (emphasis-presets.ts): the focused mark stays at full opacity, every
 * sibling dims to FOCUS.dim. ECharts gets this wrong on six families, recorded under
 * `.agents/skills/fixed/fixes/`:
 *
 * | family    | hovered mark  | scheduler  | fix note                                  |
 * |-----------|---------------|------------|-------------------------------------------|
 * | pie       | keepNormal    | microtask  | hover-focus-pie-blur                      |
 * | funnel    | keepNormal    | microtask  | hover-focus-funnel-blur                   |
 * | treemap   | keepNormal    | microtask  | hover-focus-treemap-flicker-vanish        |
 * | waterfall | keepNormal    | microtask  | hover-focus-waterfall-blur                |
 * | scatter   | emphasize     | double rAF | hover-focus-scatter-symbol-blur           |
 * | radial    | emphasize     | double rAF | hover-focus-radial-blur                   |
 *
 * - `keepNormal`: native emphasis is disabled at compile; the hovered mark stays in
 *   its NORMAL state (treemap emphasis paints the gap colour — the tile "vanishes").
 * - `emphasize`: the hovered mark is explicitly `enterEmphasis`'d (scatter Symbol
 *   blurs its own path; radial pins the ring).
 * - Every repair syncs EVERY mark of the family, not just the hovered one: adjacent
 *   marks skip mouseout and `__highByOuter` makes blurSeries skip stale paths.
 * - State calls only set flags; `markChartStatesDirty` makes ECharts apply them on
 *   the next frame, so leave + enter in one tick never flashes.
 *
 * ONE scheduler with a pending guard: a newer hover replaces the pending target and
 * `clearFocus` cancels it, so a late repair can never re-blur after the pointer left
 * (scatter's old double-rAF repair had no guard).
 */

import type { EChartsType } from "echarts/core";
import { enterBlur, enterEmphasis, leaveBlur, leaveEmphasis } from "echarts/lib/util/states.js";
import { FOCUS } from "./emphasis-presets";
import { isAnnotationSeriesId } from "./nq-mark-event";

/* ───────────────────────────── ECharts model shapes ───────────────────────────── */

export type RepairData = {
  count(): number;
  getItemGraphicEl(index: number): unknown;
  getName?(index: number): string;
  getRawValue?(index: number): unknown;
  getRawDataItem?(index: number): unknown;
  tree?: {
    getNodeByDataIndex?(index: number): { children?: unknown[]; depth?: number } | undefined;
  };
};

export type RepairSeriesModel = {
  subType?: string;
  name?: string;
  get?(key: string): unknown;
  getData(): RepairData;
};

type ChartModel = {
  getSeriesByIndex(index: number): RepairSeriesModel | null | undefined;
  eachSeries(fn: (series: RepairSeriesModel, seriesIndex: number) => void): void;
};

type BarSeriesView = { _backgroundEls?: Array<unknown | null | undefined> };

function chartModel(instance: EChartsType): ChartModel | null {
  const inst = instance as unknown as {
    isDisposed?(): boolean;
    getModel?(): ChartModel | undefined;
  };
  if (inst.isDisposed?.()) return null;
  return inst.getModel?.() ?? null;
}

function seriesOpt(series: RepairSeriesModel | null | undefined, key: string): unknown {
  return series && typeof series.get === "function" ? series.get(key) : undefined;
}

const NEEDS_STATUS_UPDATE = "__needsUpdateStatus";

/** Manual state flags only repaint after the status flag + a zrender wake-up. */
function markChartStatesDirty(instance: EChartsType): void {
  (instance as unknown as Record<string, boolean>)[NEEDS_STATUS_UPDATE] = true;
  instance.getZr().wakeUp();
}

/* ───────────────────────────── Series identification ──────────────────────────── */

/** Matches `compile-waterfall.ts` values series id / name. */
export const WATERFALL_VALUES_SERIES = "__wf_values__";
/** Matches `compile-waterfall.ts` silent stack placeholder. */
export const WATERFALL_PLACEHOLDER_SERIES = "__wf_placeholder__";
/** Matches `compile-radial-bar.ts` silent track series id. */
export const RADIAL_TRACK_SERIES_ID = "__radial_track__";

function isWaterfallValuesSeries(series: RepairSeriesModel | null | undefined): boolean {
  return (
    series?.subType === "bar" &&
    (series.name === WATERFALL_VALUES_SERIES ||
      seriesOpt(series, "id") === WATERFALL_VALUES_SERIES)
  );
}

function isRadialTrackSeries(series: RepairSeriesModel | null | undefined): boolean {
  return series?.subType === "bar" && seriesOpt(series, "id") === RADIAL_TRACK_SERIES_ID;
}

/**
 * Concentric rings and rose petals — polar bar, not the silent track.
 * Read options through `.get()` — SeriesModel has no `stack` / `id` fields
 * (fixed/hover-focus-radial-blur root cause 5).
 */
export function isRadialRingSeries(series: RepairSeriesModel | null | undefined): boolean {
  if (!series || series.subType !== "bar") return false;
  if (isRadialTrackSeries(series)) return false;
  if (seriesOpt(series, "silent") === true) return false;
  const stack = seriesOpt(series, "stack");
  if (stack === "ring" || stack === "petal") return true;
  return seriesOpt(series, "coordinateSystem") === "polar";
}

/* ─────────────────────────────────── Adapters ─────────────────────────────────── */

export type FocusTarget = { seriesIndex: number; dataIndex?: number };

export type RepairFamily = "pie" | "funnel" | "treemap" | "waterfall" | "scatter" | "radial";

export type HoverRepairAdapter = {
  family: RepairFamily;
  /** Which series this adapter owns. */
  matches(series: RepairSeriesModel): boolean;
  /** `item`: one mark per data index. `series`: the whole series is the mark (radial). */
  scope: "item" | "series";
  hoveredMode: "keepNormal" | "emphasize";
  /** microtask runs after ECharts mouseover; double rAF after ECharts high-down paints. */
  scheduler: "microtask" | "doubleRaf";
  /** The graphic that carries the state (scatter: the Symbol's path, not its group). */
  getEl?(data: RepairData, dataIndex: number): unknown;
  /** Extra marks to sync (radial tracks). `focus` null = reset. */
  extraBlur?(instance: EChartsType, focus: { hovered: RepairSeriesModel } | null): void;
  /** Fix up a mark before it is blurred (treemap: pin the blur opacity). */
  prepareBlur?(el: unknown): void;
};

type ProxiedEl = {
  stateProxy?: (name: string, targetStates?: string[]) => { style?: Record<string, unknown> } | undefined;
  childrenRef?: () => ProxiedEl[];
  __nqBlurPinned?: boolean;
};

/**
 * ECharts' treemap view builds each tile's states through a `stateProxy` whose
 * style mapper drops `opacity`, so `blur.itemStyle.opacity` never reaches the
 * bg / content rects and they fall back to ECharts' built-in blur of 0.1.
 * Wrap each proxy once so the blur state carries {@link FOCUS}.dim.
 */
function pinTreemapBlurOpacity(el: unknown): void {
  const visit = (node: ProxiedEl) => {
    if (node.stateProxy && !node.__nqBlurPinned) {
      const original = node.stateProxy;
      node.stateProxy = function (this: unknown, name, targetStates) {
        const state = original.call(this, name, targetStates);
        if (name !== "blur" || !state) return state;
        return { ...state, style: { ...(state.style ?? {}), opacity: FOCUS.dim } };
      };
      node.__nqBlurPinned = true;
    }
    node.childrenRef?.().forEach(visit);
  };
  visit(el as ProxiedEl);
}

const scatterPath = (data: RepairData, i: number): unknown => {
  const group = data.getItemGraphicEl(i) as { childAt?(i: number): unknown } | null;
  return group?.childAt?.(0) ?? null;
};

function getSeriesView(instance: EChartsType, series: RepairSeriesModel): BarSeriesView | null {
  return (
    (
      instance as unknown as {
        getViewOfSeriesModel?(model: RepairSeriesModel): BarSeriesView | null;
      }
    ).getViewOfSeriesModel?.(series) ?? null
  );
}

/** First data index of a ring that actually painted (one ring = one category). */
function paintedCategoryIndex(series: RepairSeriesModel): number | null {
  const data = series.getData();
  for (let i = 0; i < data.count(); i++) {
    if (data.getItemGraphicEl(i)) return i;
  }
  return null;
}

/**
 * Radial full-circle tracks are native `showBackground` sectors (always on at 0.35
 * opacity) plus the silent track series. Blur non-hovered tracks too — otherwise
 * they hide the focus on the basic concentric variant.
 */
function radialTrackBlur(
  instance: EChartsType,
  focus: { hovered: RepairSeriesModel } | null,
): void {
  const model = chartModel(instance);
  if (!model) return;
  const focusIndex = focus ? paintedCategoryIndex(focus.hovered) : null;
  model.eachSeries((series) => {
    if (!isRadialTrackSeries(series)) return;
    const data = series.getData();
    for (let i = 0; i < data.count(); i++) {
      const el = data.getItemGraphicEl(i);
      if (!el) continue;
      leaveEmphasis(el);
      leaveBlur(el);
    }
    const backgrounds = getSeriesView(instance, series)?._backgroundEls;
    if (!backgrounds) return;
    backgrounds.forEach((el, dataIndex) => {
      if (!el) return;
      leaveEmphasis(el);
      if (focus == null || dataIndex === focusIndex) leaveBlur(el);
      else enterBlur(el);
    });
  });
}

export const HOVER_REPAIR_ADAPTERS: readonly HoverRepairAdapter[] = [
  {
    family: "radial",
    matches: isRadialRingSeries,
    scope: "series",
    hoveredMode: "emphasize",
    scheduler: "doubleRaf",
    extraBlur: radialTrackBlur,
  },
  {
    family: "scatter",
    matches: (s) => s.subType === "scatter",
    scope: "item",
    hoveredMode: "emphasize",
    scheduler: "doubleRaf",
    getEl: scatterPath,
  },
  {
    family: "treemap",
    matches: (s) => s.subType === "treemap",
    scope: "item",
    hoveredMode: "keepNormal",
    scheduler: "microtask",
    prepareBlur: pinTreemapBlurOpacity,
  },
  {
    // Classic funnel only — custom funnel variants (pipe, rounded, cone, …) use
    // native per-element blur and need no repair.
    family: "funnel",
    matches: (s) => s.subType === "funnel",
    scope: "item",
    hoveredMode: "keepNormal",
    scheduler: "microtask",
  },
  {
    // `pie` series only — a custom-series pie variant (rose pie) uses native focus.
    family: "pie",
    matches: (s) => s.subType === "pie",
    scope: "item",
    hoveredMode: "keepNormal",
    scheduler: "microtask",
  },
  {
    family: "waterfall",
    matches: isWaterfallValuesSeries,
    scope: "item",
    hoveredMode: "keepNormal",
    scheduler: "microtask",
  },
];

export function adapterForSeries(
  series: RepairSeriesModel | null | undefined,
): HoverRepairAdapter | null {
  if (!series) return null;
  return HOVER_REPAIR_ADAPTERS.find((a) => a.matches(series)) ?? null;
}

export function resolveRepairAdapter(
  instance: EChartsType,
  seriesIndex: number,
): HoverRepairAdapter | null {
  return adapterForSeries(chartModel(instance)?.getSeriesByIndex(seriesIndex));
}

/* ──────────────────────────────────── Repair ──────────────────────────────────── */

function elOf(adapter: HoverRepairAdapter, data: RepairData, i: number): unknown {
  return adapter.getEl ? adapter.getEl(data, i) : data.getItemGraphicEl(i);
}

function setFocused(el: unknown, mode: HoverRepairAdapter["hoveredMode"]): void {
  leaveBlur(el);
  if (mode === "emphasize") enterEmphasis(el);
  else leaveEmphasis(el);
}

function setDimmed(el: unknown, adapter?: HoverRepairAdapter): void {
  adapter?.prepareBlur?.(el);
  leaveEmphasis(el);
  enterBlur(el);
}

/** Sync every mark the adapter owns to "one focused, the rest dimmed". */
export function repairHoverFocus(
  instance: EChartsType,
  adapter: HoverRepairAdapter,
  target: FocusTarget,
): void {
  const model = chartModel(instance);
  if (!model) return;
  const hovered = model.getSeriesByIndex(target.seriesIndex);
  if (!hovered || !adapter.matches(hovered)) return;

  if (adapter.scope === "series") {
    model.eachSeries((series, seriesIndex) => {
      if (!adapter.matches(series)) return;
      const data = series.getData();
      for (let i = 0; i < data.count(); i++) {
        const el = elOf(adapter, data, i);
        if (!el) continue;
        if (seriesIndex === target.seriesIndex) setFocused(el, adapter.hoveredMode);
        else setDimmed(el, adapter);
      }
    });
  } else {
    if (target.dataIndex == null) return;
    const data = hovered.getData();
    for (let i = 0; i < data.count(); i++) {
      const el = elOf(adapter, data, i);
      if (!el) continue;
      if (i === target.dataIndex) setFocused(el, adapter.hoveredMode);
      else setDimmed(el, adapter);
    }
  }

  adapter.extraBlur?.(instance, { hovered });
  markChartStatesDirty(instance);
}

/** Return every mark the adapter owns to the normal state. */
export function resetHoverFocus(instance: EChartsType, adapter: HoverRepairAdapter): void {
  const model = chartModel(instance);
  if (!model) return;
  let touched = false;
  model.eachSeries((series) => {
    if (!adapter.matches(series)) return;
    touched = true;
    const data = series.getData();
    for (let i = 0; i < data.count(); i++) {
      const el = elOf(adapter, data, i);
      if (!el) continue;
      leaveEmphasis(el);
      leaveBlur(el);
    }
  });
  if (!touched) return;
  adapter.extraBlur?.(instance, null);
  markChartStatesDirty(instance);
}

/* ─────────────────────────────────── Scheduler ────────────────────────────────── */

type Pending = {
  adapter: HoverRepairAdapter;
  target: FocusTarget;
  cancel: () => void;
};

const pending = new WeakMap<EChartsType, Pending>();

function defer(kind: HoverRepairAdapter["scheduler"], run: () => void): () => void {
  if (kind === "microtask") {
    let live = true;
    queueMicrotask(() => {
      if (live) run();
    });
    return () => {
      live = false;
    };
  }
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(run);
  });
  return () => {
    cancelAnimationFrame(outer);
    if (inner) cancelAnimationFrame(inner);
  };
}

/**
 * Coalesce hovers into one repair per tick (microtask) or per two frames (double
 * rAF). A newer target replaces the pending one; `cancelPendingRepair` drops it.
 */
export function scheduleHoverFocusRepair(
  instance: EChartsType,
  adapter: HoverRepairAdapter,
  target: FocusTarget,
): void {
  const current = pending.get(instance);
  if (current && current.adapter.scheduler === adapter.scheduler) {
    current.adapter = adapter;
    current.target = target;
    return;
  }
  current?.cancel();

  const entry: Pending = { adapter, target, cancel: () => {} };
  entry.cancel = defer(adapter.scheduler, () => {
    if (pending.get(instance) !== entry) return;
    pending.delete(instance);
    repairHoverFocus(instance, entry.adapter, entry.target);
  });
  pending.set(instance, entry);
}

export function cancelPendingRepair(instance: EChartsType): void {
  const current = pending.get(instance);
  if (!current) return;
  current.cancel();
  pending.delete(instance);
}

export function hasPendingRepair(instance: EChartsType): boolean {
  return pending.has(instance);
}

/* ───────────────────────────── hoverFocus opt-out ─────────────────────────────── */

const hoverFocusOff = new WeakMap<EChartsType, true>();

/** `useNQEcharts` mirrors the root's `hoverFocus` prop onto its instance. */
export function setHoverFocusEnabled(instance: EChartsType, enabled: boolean): void {
  if (enabled) hoverFocusOff.delete(instance);
  else hoverFocusOff.set(instance, true);
}

export function isHoverFocusEnabled(instance: EChartsType): boolean {
  return !hoverFocusOff.has(instance);
}

/* ─────────────────────────────── focusMark / clear ────────────────────────────── */

export type FocusSource = "pointer" | "keyboard";

/**
 * Focus one mark — the single entry point for pointer hover and keyboard focus.
 *
 * - Repair families: schedule the family repair (native emphasis is off for them,
 *   so a `highlight` action would be invisible).
 * - Every other family, pointer: ECharts' own high-down already ran — nothing to do.
 * - Every other family, keyboard: dispatch native `highlight` (after a `downplay`
 *   so the previous mark lets go) — after `showTip`, which would otherwise undo it.
 * - Keyboard always shows the tooltip, even with `hoverFocus={false}`; dimming is
 *   skipped entirely when the root opted out.
 */
export function focusMark(
  instance: EChartsType,
  target: FocusTarget,
  source: FocusSource = "pointer",
): void {
  if (!chartModel(instance)) return;
  // Tip FIRST: an axis tooltip's pointer dispatches its own highlight/downplay
  // without blur, which would wipe a highlight dispatched before it.
  if (source === "keyboard") {
    instance.dispatchAction({
      type: "showTip",
      seriesIndex: target.seriesIndex,
      dataIndex: target.dataIndex,
    });
  }
  if (isHoverFocusEnabled(instance)) {
    const adapter = resolveRepairAdapter(instance, target.seriesIndex);
    if (adapter) {
      if (adapter.scope === "series" || target.dataIndex != null) {
        scheduleHoverFocusRepair(instance, adapter, target);
      }
    } else if (source === "keyboard") {
      instance.dispatchAction({ type: "downplay" });
      instance.dispatchAction({
        type: "highlight",
        seriesIndex: target.seriesIndex,
        dataIndex: target.dataIndex,
      });
    }
  }
}

/**
 * Drop any focus: cancel a pending repair (so it cannot re-blur late), reset every
 * repair family, and — for keyboard — downplay native emphasis and hide the tip.
 */
export function clearFocus(instance: EChartsType, source: FocusSource = "pointer"): void {
  cancelPendingRepair(instance);
  if (!chartModel(instance)) return;
  for (const adapter of HOVER_REPAIR_ADAPTERS) resetHoverFocus(instance, adapter);
  if (source === "keyboard") {
    instance.dispatchAction({ type: "downplay" });
    instance.dispatchAction({ type: "hideTip" });
  }
}

/* ───────────────────────────── Keyboard mark list ─────────────────────────────── */

function isDecorationSeries(series: RepairSeriesModel): boolean {
  if (seriesOpt(series, "silent") === true) return true;
  const id = seriesOpt(series, "id");
  if (typeof id !== "string") return false;
  if (id === WATERFALL_VALUES_SERIES || id === "__nq_scatter__") return false;
  // Internal plumbing (`__radial_track__`, `__rose_labels__`, …) and annotations.
  return id.startsWith("__") || isAnnotationSeriesId(id);
}

/**
 * Every focusable mark in paint order — keyboard nav for charts whose marks are not
 * a simple category × series grid (radial rings, radar polygons, heatmap / calendar
 * cells, treemap leaves, tile columns). Skips silent / internal series, marks that
 * did not paint, and treemap group nodes.
 */
export function listFocusTargets(instance: EChartsType): FocusTarget[] {
  const model = chartModel(instance);
  if (!model) return [];
  const out: FocusTarget[] = [];
  model.eachSeries((series, seriesIndex) => {
    if (isDecorationSeries(series)) return;
    const data = series.getData();
    for (let i = 0; i < data.count(); i++) {
      if (!data.getItemGraphicEl(i)) continue;
      if (series.subType === "treemap") {
        const node = data.tree?.getNodeByDataIndex?.(i);
        if (!node || (node.depth ?? 0) === 0 || (node.children?.length ?? 0) > 0) continue;
      }
      out.push({ seriesIndex, dataIndex: i });
    }
  });
  return out;
}

/** Series index by option id (e.g. waterfall `__wf_values__`). -1 when absent. */
export function seriesIndexById(instance: EChartsType, id: string): number {
  const model = chartModel(instance);
  if (!model) return -1;
  let found = -1;
  model.eachSeries((series, seriesIndex) => {
    if (found < 0 && seriesOpt(series, "id") === id) found = seriesIndex;
  });
  return found;
}

/** Waterfall keyboard nav: every series position maps to the painted value bars. */
export function waterfallValuesSeriesIndex(instance: EChartsType): number {
  return seriesIndexById(instance, WATERFALL_VALUES_SERIES);
}

/**
 * ECharts click-shaped params for a mark, so keyboard Enter maps through the same
 * `mapEChartsClickToMarkEvent` path as a pointer click.
 */
export function markParamsAt(
  instance: EChartsType,
  target: FocusTarget,
): {
  componentType: "series";
  seriesType?: string;
  seriesIndex: number;
  seriesId?: string;
  seriesName?: string;
  dataIndex?: number;
  name?: string;
  value?: unknown;
  data?: unknown;
} | null {
  const series = chartModel(instance)?.getSeriesByIndex(target.seriesIndex);
  if (!series) return null;
  const data = series.getData();
  const i = target.dataIndex;
  const id = seriesOpt(series, "id");
  return {
    componentType: "series",
    seriesType: series.subType,
    seriesIndex: target.seriesIndex,
    seriesId: typeof id === "string" ? id : undefined,
    seriesName: series.name,
    dataIndex: i,
    name: i != null ? data.getName?.(i) : undefined,
    value: i != null ? data.getRawValue?.(i) : undefined,
    data: i != null ? data.getRawDataItem?.(i) : undefined,
  };
}
