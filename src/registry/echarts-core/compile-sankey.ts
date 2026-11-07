import type { EChartsOption } from "echarts";
import { applyChartUiToOption } from "./apply-chart-ui";
import { CHART_FONT_SIZE, CHART_FONT_WEIGHT, CHART_TYPOGRAPHY } from "./chart-typography-tokens";
import { clampRadius, resolveChartSignature } from "./chart-signature";
import { escapeHtml, tooltipShell } from "./echarts-tooltip";
import { FOCUS, focusTiming, hoverFocusOrOff, isHoverFocusOn } from "./emphasis-presets";
import { headlessThemeOf } from "./headless-theme";
import { NQ_DATUM, NQ_SERIES_KEY } from "./nq-mark-event";
import type {
  CompileContext,
  SankeyLinkColor,
  SankeyNodeAlign,
  SankeyOrient,
  SankeyPart,
  TooltipPart,
} from "./parts/types";
import { resolveCanvasChartChrome, resolveCanvasGapColor } from "./resolve-chart-chrome";
import { resolveCssColorValue } from "./resolve-chart-colors";

/** Link fill opacity at rest — flows read as quiet bands under the nodes. */
export const SANKEY_LINK_OPACITY = 0.4;
/** Default node thickness in px. */
export const SANKEY_NODE_WIDTH = 12;
/** Space between a node and its label in px. */
const LABEL_DISTANCE = 6;
/** Plot inset that keeps vertical-orient labels (above / below the rows) on the canvas. */
const VERTICAL_LABEL_ROOM = 22;

/** Light `--chart-1…5` (src/app/globals.css) as hex — used only when the token is unreadable. */
const PALETTE_FALLBACK = ["#4f46e5", "#0d9488", "#1f4e63", "#f2b705", "#f59e0b"] as const;

export type SankeyGraphNode = {
  name: string;
  /** Throughput: max(sum of inflow, sum of outflow). */
  value: number;
  inflow: number;
  outflow: number;
  /** Column (horizontal) / row (vertical) index for the active `nodeAlign`. */
  column: number;
  /** The caller's node row, or `{ name }` for a derived node. */
  datum: Record<string, unknown>;
};

export type SankeyGraphLink = {
  source: string;
  target: string;
  value: number;
  row: Record<string, unknown>;
};

export type SankeyGraph = {
  nodes: SankeyGraphNode[];
  links: SankeyGraphLink[];
  /** Last column index (0 when the graph is empty). */
  maxColumn: number;
};

function warnDev(message: string) {
  if (process.env.NODE_ENV !== "production") console.warn(`[NQSankeyChart] ${message}`);
}

/** True when `from` can already reach `to` through `adjacency`. */
function reaches(adjacency: Map<string, Set<string>>, from: string, to: string): boolean {
  const stack = [from];
  const seen = new Set<string>();
  while (stack.length) {
    const at = stack.pop()!;
    if (at === to) return true;
    if (seen.has(at)) continue;
    seen.add(at);
    for (const next of adjacency.get(at) ?? []) stack.push(next);
  }
  return false;
}

/**
 * Nodes + links from the link rows. Nodes come from `nodes` (order kept) and then
 * from first appearance in the rows. Rows with a missing end, a non-positive value,
 * a self-loop or a cycle are dropped — ECharts' sankey layout throws on a cycle.
 */
export function deriveSankeyGraph(
  rows: Record<string, unknown>[],
  opts: {
    sourceKey?: string;
    targetKey?: string;
    valueKey?: string;
    nodes?: SankeyPart["nodes"];
    nodeAlign?: SankeyNodeAlign;
  } = {},
): SankeyGraph {
  const sourceKey = opts.sourceKey ?? "source";
  const targetKey = opts.targetKey ?? "target";
  const valueKey = opts.valueKey ?? "value";

  const order: string[] = [];
  const datums = new Map<string, Record<string, unknown>>();
  const addNode = (name: string, datum?: Record<string, unknown>) => {
    if (datums.has(name)) return;
    order.push(name);
    datums.set(name, datum ?? { name });
  };
  for (const node of opts.nodes ?? []) {
    if (node?.name != null && node.name !== "") addNode(String(node.name), node);
  }

  const adjacency = new Map<string, Set<string>>();
  const links: SankeyGraphLink[] = [];
  for (const row of rows) {
    const rawSource = row[sourceKey];
    const rawTarget = row[targetKey];
    const value = Number(row[valueKey]);
    if (rawSource == null || rawSource === "" || rawTarget == null || rawTarget === "") continue;
    if (!Number.isFinite(value) || value <= 0) continue;
    const source = String(rawSource);
    const target = String(rawTarget);
    if (source === target || reaches(adjacency, target, source)) {
      warnDev(`dropped "${source}" → "${target}": a sankey cannot contain a cycle.`);
      continue;
    }
    addNode(source);
    addNode(target);
    if (!adjacency.has(source)) adjacency.set(source, new Set());
    adjacency.get(source)!.add(target);
    links.push({ source, target, value, row });
  }

  const inflow = new Map<string, number>();
  const outflow = new Map<string, number>();
  const incoming = new Map<string, string[]>();
  for (const link of links) {
    outflow.set(link.source, (outflow.get(link.source) ?? 0) + link.value);
    inflow.set(link.target, (inflow.get(link.target) ?? 0) + link.value);
    incoming.set(link.target, [...(incoming.get(link.target) ?? []), link.source]);
  }

  // Longest path from a source (depth) and to a sink (height) — the DAG is
  // guaranteed above, so plain memoised recursion terminates.
  const depthMemo = new Map<string, number>();
  const depth = (name: string): number => {
    const cached = depthMemo.get(name);
    if (cached != null) return cached;
    const parents = incoming.get(name) ?? [];
    const d = parents.length ? Math.max(...parents.map(depth)) + 1 : 0;
    depthMemo.set(name, d);
    return d;
  };
  const heightMemo = new Map<string, number>();
  const height = (name: string): number => {
    const cached = heightMemo.get(name);
    if (cached != null) return cached;
    const children = [...(adjacency.get(name) ?? [])];
    const h = children.length ? Math.max(...children.map(height)) + 1 : 0;
    heightMemo.set(name, h);
    return h;
  };
  const maxColumn = order.length ? Math.max(...order.map(depth)) : 0;
  const align = opts.nodeAlign ?? "justify";
  const columnOf = (name: string): number => {
    if (align === "left") return depth(name);
    if (align === "right") return maxColumn - height(name);
    // justify: sinks go to the last column (ECharts `nodeAlign: "justify"`).
    return (adjacency.get(name)?.size ?? 0) === 0 ? maxColumn : depth(name);
  };

  const nodes = order.map((name) => {
    const inSum = inflow.get(name) ?? 0;
    const outSum = outflow.get(name) ?? 0;
    return {
      name,
      value: Math.max(inSum, outSum),
      inflow: inSum,
      outflow: outSum,
      column: columnOf(name),
      datum: datums.get(name)!,
    };
  });
  return { nodes, links, maxColumn };
}

/** `--chart-N` for nodes the config does not name — live token, headless token, or hex. */
function paletteColor(chartId: string, index: number): string {
  const slot = (index % PALETTE_FALLBACK.length) + 1;
  const fallback = PALETTE_FALLBACK[slot - 1]!;
  const ref = `var(--chart-${slot})`;
  const theme = headlessThemeOf(chartId);
  if (theme) {
    const resolved = resolveCssColorValue(ref, null, theme.tokens);
    return resolved.startsWith("var(") ? fallback : resolved;
  }
  if (typeof document === "undefined") return fallback;
  const el = document.querySelector(`[data-chart="${chartId}"]`) ?? document.documentElement;
  const resolved = resolveCssColorValue(ref, el);
  return resolved.startsWith("var(") ? fallback : resolved;
}

/** Node colour: its `config` entry, else the next palette slot (config-less nodes only). */
export function resolveSankeyNodeColors(
  ctx: Pick<CompileContext, "chartId" | "config" | "resolveColor">,
  names: string[],
): Map<string, string> {
  const colors = new Map<string, string>();
  let paletteIndex = 0;
  for (const name of names) {
    colors.set(
      name,
      ctx.config[name] ? ctx.resolveColor(name, 0) : paletteColor(ctx.chartId, paletteIndex++),
    );
  }
  return colors;
}

/**
 * Sankey focus — the one contract, ECharts' native adjacency mapping.
 *
 * `focus: "adjacency"`: hovering a node keeps it and its links; hovering a link
 * keeps it and its two nodes. Everything else blurs. Nodes and labels dim to
 * FOCUS.dim; links already rest at {@link SANKEY_LINK_OPACITY}, so they dim by the
 * same factor (`SANKEY_LINK_OPACITY × FOCUS.dim`) — a link at an absolute 0.2 would
 * barely separate from a focused one at 0.4.
 *
 * Emphasis restates the normal look (link opacity, link colour keyword; node colour
 * per data item), so the hovered mark never lifts colour or grows. No repair adapter:
 * ECharts' high-down for sankey has no adjacent-segment race.
 */
export function sankeyFocus(linkColor: SankeyLinkColor, showLabels: boolean) {
  return {
    blur: {
      itemStyle: { opacity: FOCUS.dim },
      lineStyle: { opacity: SANKEY_LINK_OPACITY * FOCUS.dim },
      label: { opacity: FOCUS.dim },
    },
    emphasis: {
      focus: "adjacency" as const,
      blurScope: "series" as const,
      disabled: false as const,
      itemStyle: { opacity: 1 },
      lineStyle: { opacity: SANKEY_LINK_OPACITY, color: linkColor },
      // ECharts' sankey default shows labels on emphasis — keep the rest state.
      label: { show: showLabels },
    },
    ...focusTiming(),
  };
}

type SankeyTooltipParams = {
  dataType?: string;
  name?: string;
  value?: unknown;
  data?: { source?: string; target?: string; value?: number; name?: string };
};

function labelPosition(
  orient: SankeyOrient,
  column: number,
  maxColumn: number,
): "left" | "right" | "top" | "bottom" {
  const last = maxColumn > 0 && column >= maxColumn;
  if (orient === "vertical") return last ? "bottom" : "top";
  return last ? "left" : "right";
}

/**
 * Corner radii `[tl, tr, br, bl]` for a node: round only the sides with no
 * links attached. A rounded corner where a link band meets the node curves
 * away from the band and opens a notch between them.
 */
export function sankeyNodeCorners(
  orient: SankeyOrient,
  r: number,
  hasIn: boolean,
  hasOut: boolean,
): [number, number, number, number] {
  const inSide = hasIn ? 0 : r;
  const outSide = hasOut ? 0 : r;
  // Horizontal: links enter on the left, leave on the right.
  // Vertical: links enter on the top, leave on the bottom.
  return orient === "vertical"
    ? [inSide, inSide, outSide, outSide]
    : [inSide, outSide, outSide, inSide];
}

/** Strip rich-text control characters from a label fragment. */
function richSafe(text: string): string {
  return text.replace(/[{}|]/g, "");
}

export function compileSankeyOption(ctx: CompileContext): EChartsOption {
  const part = ctx.parts.find((p): p is SankeyPart => p.type === "sankey");
  const orient = part?.orient ?? "horizontal";
  const showLabels = part?.showLabels ?? true;
  const linkColor = part?.linkColor ?? "source";
  const format = part?.formatValue ?? ((v: number) => v.toLocaleString());
  const { radius, gap } = resolveChartSignature(ctx.chartId);
  const nodeWidth = part?.nodeWidth ?? SANKEY_NODE_WIDTH;
  const nodeGap = part?.nodeGap ?? gap.stage;
  const chrome = resolveCanvasChartChrome(ctx.chartId);

  const graph = deriveSankeyGraph(ctx.data, {
    sourceKey: part?.sourceKey,
    targetKey: part?.targetKey,
    valueKey: part?.valueKey,
    nodes: part?.nodes,
    nodeAlign: part?.nodeAlign,
  });
  const colors = resolveSankeyNodeColors(
    ctx,
    graph.nodes.map((n) => n.name),
  );
  const focusOn = isHoverFocusOn(ctx);

  const nodeRadius = clampRadius(radius.mark, nodeWidth);
  const hasIn = new Set(graph.links.map((l) => String(l.target)));
  const hasOut = new Set(graph.links.map((l) => String(l.source)));

  const nodes = graph.nodes.map((node) => {
    const color = colors.get(node.name)!;
    return {
      name: node.name,
      value: node.value,
      itemStyle: {
        color,
        borderRadius: sankeyNodeCorners(
          orient,
          nodeRadius,
          hasIn.has(String(node.name)),
          hasOut.has(String(node.name)),
        ),
      },
      // Explicit, not inherited: an emphasis fill left unset is "lifted" (recoloured).
      emphasis: { itemStyle: { color } },
      label: { position: labelPosition(orient, node.column, graph.maxColumn) },
      [NQ_DATUM]: { ...node.datum, name: node.name, value: node.value },
      [NQ_SERIES_KEY]: node.name,
    };
  });
  const links = graph.links.map((link) => ({
    source: link.source,
    target: link.target,
    value: link.value,
    [NQ_DATUM]: link.row,
    [NQ_SERIES_KEY]: link.source,
  }));

  const nodeByName = new Map(graph.nodes.map((n) => [n.name, n]));
  const nativeTooltip = (raw: unknown) => {
    const p = raw as SankeyTooltipParams;
    if (p.dataType === "edge") {
      const d = p.data ?? {};
      return `${escapeHtml(labelOf(ctx, d.source))} → ${escapeHtml(labelOf(ctx, d.target))}: ${escapeHtml(format(Number(d.value)))}`;
    }
    const node = nodeByName.get(String(p.name));
    return `${escapeHtml(labelOf(ctx, p.name))}: ${escapeHtml(format(node?.value ?? Number(p.value)))}`;
  };

  const vertical = orient === "vertical";
  const halo = resolveCanvasGapColor(ctx.chartId);
  const labelRoom = showLabels && vertical ? VERTICAL_LABEL_ROOM : 4;

  const base: EChartsOption = {
    tooltip: { trigger: "item", formatter: nativeTooltip },
    series: [
      {
        type: "sankey",
        id: "sankey",
        orient,
        nodeAlign: part?.nodeAlign ?? "justify",
        nodeWidth,
        nodeGap,
        draggable: false,
        left: vertical ? 4 : 1,
        right: vertical ? 4 : 1,
        top: labelRoom,
        bottom: labelRoom,
        layoutIterations: 32,
        // Signature: node corners = `radius.mark`, clamped to the node's thickness;
        // no painted border (links meet the node edge directly).
        // Per-node corners (see `sankeyNodeCorners`); no painted border, so
        // links meet the node edge directly.
        itemStyle: { borderWidth: 0 },
        lineStyle: { color: linkColor, opacity: SANKEY_LINK_OPACITY, curveness: 0.5 },
        label: {
          show: showLabels,
          distance: LABEL_DISTANCE,
          color: chrome.foreground,
          // Labels sit over the flows; a halo in the canvas colour keeps them
          // legible on any link colour.
          textBorderColor: halo,
          textBorderWidth: 3,
          ...CHART_TYPOGRAPHY.markLabel,
          formatter: (raw: unknown) => {
            const p = raw as { name?: string; value?: unknown };
            const value = Number(p.value);
            const name = richSafe(labelOf(ctx, p.name));
            return Number.isFinite(value)
              ? `{name|${name}} {value|${richSafe(format(value))}}`
              : `{name|${name}}`;
          },
          rich: {
            name: {
              color: chrome.foreground,
              ...CHART_TYPOGRAPHY.markLabel,
              textBorderColor: halo,
              textBorderWidth: 3,
            },
            value: {
              color: chrome.muted,
              textBorderColor: halo,
              textBorderWidth: 3,
              fontSize: CHART_FONT_SIZE.small,
              fontWeight: CHART_FONT_WEIGHT.normal,
            },
          },
        },
        ...hoverFocusOrOff(focusOn, sankeyFocus(linkColor, showLabels)),
        data: nodes,
        links,
      },
    ] as EChartsOption["series"],
  };

  const option = applyChartUiToOption(ctx, base);
  const tooltipPart = ctx.parts.find((p): p is TooltipPart => p.type === "tooltip");
  if (!tooltipPart || tooltipPart.hide) return option;
  const tip = option.tooltip;
  if (!tip || Array.isArray(tip)) return option;

  // `<Tooltip />` swaps in the card formatter; sankey rows need their own
  // content (node throughput, "source → target" flows) in the same card shell.
  const dot = (color: string | undefined) =>
    tooltipPart.hideIndicator || !color
      ? ""
      : `<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] mr-2" style="background:${escapeHtml(color)}"></span>`;
  const row = (label: string, color: string | undefined, value: string) =>
    `<div class="flex w-full items-center justify-between gap-4 leading-none">
    <span class="text-muted-foreground flex items-center">${dot(color)}${label}</span>
    <span class="font-mono font-medium tabular-nums">${escapeHtml(value)}</span>
  </div>`;
  const cardTooltip = (raw: unknown) => {
    const p = raw as SankeyTooltipParams;
    if (p.dataType === "edge") {
      const d = p.data ?? {};
      const label = `${escapeHtml(labelOf(ctx, d.source))} → ${escapeHtml(labelOf(ctx, d.target))}`;
      return tooltipShell(
        `<div class="grid gap-1.5">${row(label, colors.get(String(d.source)), format(Number(d.value)))}</div>`,
        tooltipPart,
        ctx.chartId,
      );
    }
    const name = String(p.name ?? "");
    const node = nodeByName.get(name);
    return tooltipShell(
      `<div class="grid gap-1.5">${row(escapeHtml(labelOf(ctx, name)), colors.get(name), format(node?.value ?? Number(p.value)))}</div>`,
      tooltipPart,
      ctx.chartId,
    );
  };
  return { ...option, tooltip: { ...tip, formatter: cardTooltip } };
}

/** Display label for a node: its `config` label when set, else the name. */
function labelOf(ctx: Pick<CompileContext, "config">, name: unknown): string {
  const key = String(name ?? "");
  const label = ctx.config[key]?.label;
  return label != null && typeof label !== "object" ? String(label) : key;
}
