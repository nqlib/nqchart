import type { ChartConfig } from "@/registry/ui/chart";

export type StackType = "default" | "stacked" | "percent";
export type BarLayout = "vertical" | "horizontal";

export type GridPart = { type: "grid"; id: string; show?: boolean };
export type NQScale = "linear" | "log" | "time" | "category";

export type XAxisPart = {
  type: "xAxis";
  id: string;
  dataKey?: string;
  hide?: boolean;
  tickFormatter?: (value: unknown, index?: number) => string;
  domain?: [number, number];
  ticks?: number[];
  scale?: NQScale;
  reversed?: boolean;
  labelRotate?: number;
  labelInterval?: number | "auto";
};
export type YAxisPart = {
  type: "yAxis";
  id: string;
  dataKey?: string;
  yAxisId?: string;
  hide?: boolean;
  orientation?: "left" | "right";
  domain?: [number, number];
  unit?: string;
  tickFormatter?: (value: unknown, index?: number) => string;
  scale?: NQScale;
  reversed?: boolean;
  labelRotate?: number;
  labelInterval?: number | "auto";
};
export type BarSeriesPart = {
  type: "bar";
  id: string;
  dataKey: string;
  variant?: string;
  yAxisId?: string;
  stackId?: string;
  /** Corner radius in px; falls back to chart `barRadius`. */
  radius?: number;
  /** When false, omitted from the HTML `<Legend />` (series still renders). */
  showInLegend?: boolean;
  showLabels?: boolean;
  labelFormatter?: (value: unknown) => string;
};
export type LineSeriesPart = {
  type: "line";
  id: string;
  dataKey: string;
  curveType?: "linear" | "monotone" | "step" | "bump";
  yAxisId?: string;
  smooth?: boolean;
  /** `points` — rect tick markers only (box-plot medians). `dots` — round markers only (dumbbell ends). `dashed` / `dotted` set stroke dash. */
  variant?: "solid" | "dashed" | "dotted" | "points" | "dots" | string;
  showInLegend?: boolean;
  showLabels?: boolean;
  labelFormatter?: (value: unknown) => string;
};

/** Box-plot whiskers: vertical stems min↔Q1 and Q3↔max with end caps. */
export type WhiskersPart = {
  type: "whiskers";
  id: string;
  minKey: string;
  q1Key: string;
  q3Key: string;
  maxKey: string;
  /** Config / legend key. */
  dataKey: string;
  showInLegend?: boolean;
};

/** Dumbbell connector: a segment between two values per category (composed charts). */
export type ConnectorPart = {
  type: "connector";
  id: string;
  fromKey: string;
  toKey: string;
  /** Config / legend key. */
  dataKey: string;
  showInLegend?: boolean;
};

export type AreaSeriesPart = {
  type: "area";
  id: string;
  dataKey: string;
  curveType?: "linear" | "monotone" | "step" | "bump";
  variant?: string;
  yAxisId?: string;
  stackId?: string;
  showInLegend?: boolean;
  showLabels?: boolean;
  labelFormatter?: (value: unknown) => string;
};

export type ScatterSeriesPart = {
  type: "scatter";
  id: string;
  dataKey: string;
  points?: Array<Record<string, number>>;
  xKey?: string;
  yKey?: string;
  variant?: string;
  yAxisId?: string;
};

export type ReferenceLinePart = {
  type: "referenceLine";
  id: string;
  y?: number;
  x?: string | number;
  yAxisId?: string;
  label?: string;
  labelPosition?: "start" | "middle" | "end";
  variant?: "solid" | "dashed" | "dotted";
  tone?: "neutral" | "accent" | "positive" | "warning" | "critical";
  /** When true (default), widen an auto axis so this mark stays on the plot. */
  includeInDomain?: boolean;
};

export type ReferenceBandPart = {
  type: "referenceBand";
  id: string;
  /** `null` is the axis edge (`"min"` / `"max"`). */
  y?: [number | null, number | null];
  x?: [string | number, string | number];
  yAxisId?: string;
  label?: string;
  tone?: "neutral" | "accent" | "positive" | "warning" | "critical";
  opacity?: number;
  /** When true (default), widen an auto axis so this band stays on the plot. */
  includeInDomain?: boolean;
};

export type RangeAreaPart = {
  type: "rangeArea";
  id: string;
  lowKey: string;
  highKey: string;
  yAxisId?: string;
  tone?: "neutral" | "accent" | "positive" | "warning" | "critical";
  opacity?: number;
  label?: string;
};

export type RadarSeriesPart = {
  type: "radar";
  id: string;
  dataKey: string;
  variant?: string;
};

export type PolarAngleAxisPart = { type: "polarAngleAxis"; id: string; dataKey?: string };
export type PolarGridPart = { type: "polarGrid"; id: string; variant?: string };

export type FunnelPart = {
  type: "funnel";
  id: string;
  stageKey?: string;
  valueKey?: string;
};

/** Controls spacing and taper between funnel stages. */
export type FunnelConnection =
  | "seamless"
  | "default"
  | "segmented"
  | "pipe"
  /** Soft capsule / rounded stages (custom series) — not the pipe ribbon. */
  | "rounded"
  /** 3D cone slices (custom series): elliptical rims, shaded frustums. */
  | "cone";
export type FunnelTaper = "soft" | "default" | "steep";
/**
 * Cone (`connection="cone"`) top-face look. `solid` = every slice shows a lit
 * top face; `hollow` = the first stage shows the dark funnel opening.
 */
export type FunnelConeStyle = "solid" | "hollow";
export type FunnelOrient = "vertical" | "horizontal";
/** ECharts `series-funnel.sort`. Default `none` keeps `data` array order. */
export type FunnelSort = "ascending" | "descending" | "none";

export type FunnelStylePart = {
  type: "funnelStyle";
  id: string;
  /**
   * Stage spacing / silhouette preset. `pipe` = continuous S-curve ribbon;
   * `rounded` = curved trapezoid (continuous taper, rim curves, gaps;
   * cornerRadius / sideCurve opt-in). Capsule (value-true) bands need
   * `widthMode: "capsule"` on the geometry options.
   */
  connection?: FunnelConnection;
  /**
   * Width floor for the value→width scale (`minSize`). Soft (22%) flattens
   * dynamic range — prefer default/steep for tapered rounded funnels.
   */
  taper?: FunnelTaper;
  /** Pixel gap override (wins over `connection` gap; ignored for `pipe`). */
  stageGap?: number;
  /** Flow direction. Pipe defaults horizontal when unset; supports vertical too. */
  orient?: FunnelOrient;
  /**
   * Stage order for native / rounded funnel. Default `none` preserves `data` order.
   * Unused for `pipe` (custom series already follows data order).
   */
  sort?: FunnelSort;
  /**
   * Pipe mode: half-width of the S-curve join zone in px (radius lives only
   * between levels; outer ends stay square). Omit for a tight ~8% fillet
   * (capped). Keep small — large values read as shoulders into the prior stage.
   */
  turnRadius?: number;
  /** Pipe / rounded: draw stage labels (default true). */
  showLabels?: boolean;
  /**
   * Corner softness in px. Applies to native trapezoids and `connection="rounded"`.
   * When > 0 on a non-pipe connection, stages render as custom soft paths
   * (ECharts `borderRadius` does not visibly round funnel polygons).
   * Default 14 when `connection="rounded"`, else 0. Independent of `sideCurve`.
   */
  cornerRadius?: number;
  /**
   * Side-wall bow for soft/custom stages (0 = straight sides, 1 = max).
   * Default 0 — set `cornerRadius` alone for soft trapezoids; add ~0.15–0.25 for a
   * subtle bow. Does not affect shared-edge width/sagitta matching.
   * Ignored for sharp native (cornerRadius 0) and pipe.
   */
  sideCurve?: number;
  /**
   * Rim curvature for soft/custom stages: each horizontal edge dips by
   * `rimDepth × edgeWidth` (0 = flat, max 0.2). Proportional, so every rim keeps
   * the same shape. Default 0.03 for `connection="rounded"`, else 0.
   */
  rimDepth?: number;
  /**
   * Radius (px) of every stage corner facing a gap; only the funnel's outer
   * corners use `cornerRadius`. Default 3, clamped to `cornerRadius`.
   */
  innerCornerRadius?: number;
  /**
   * Cone only: rim ellipse height / width (`ry = coneTilt · rx`) — how far
   * above the funnel the viewer sits. 0–0.5, default 0.18.
   */
  coneTilt?: number;
  /** Cone only: `"hollow"` (default) shows the funnel opening; `"solid"` lit slices. */
  coneStyle?: FunnelConeStyle;
};

export type WaterfallRow = {
  name: string;
  value: number;
  type?: "start" | "increase" | "decrease" | "total";
};

export type WaterfallPart = {
  type: "waterfall";
  id: string;
  nameKey?: string;
  valueKey?: string;
  typeKey?: string;
  /** Corner radius in px; falls back to chart `barRadius`, then the signature `radius.mark`. */
  radius?: number;
};

export type TreemapNode = {
  name: string;
  value?: number;
  children?: TreemapNode[];
};

export type TreemapStylePart = {
  type: "treemapStyle";
  id: string;
  showLabels?: boolean;
  isClickable?: boolean;
};

export type TreemapPart = {
  type: "treemap";
  id: string;
  dataKey: string;
  tree?: TreemapNode[];
};

export type SparklinePart = {
  type: "sparkline";
  id: string;
  dataKey: string;
  showFill?: boolean;
  variant?: string;
};

export type RadialBarPart = {
  type: "radialBar";
  id: string;
  dataKey: string;
  cornerRadius?: number;
  barSize?: number;
  showBackground?: boolean;
  isClickable?: boolean;
  showLabels?: boolean;
};

export type BrushPart = { type: "brush"; id: string };
/** Slice order. Default `none` keeps data order (rose defaults to `descending`). */
export type PieSort = "descending" | "ascending" | "none";
/**
 * Nightingale rose. `radius` — slice angle *and* length ∝ value;
 * `area` — equal angles, length ∝ value.
 */
export type PieRose = "radius" | "area";

export type PieSeriesPart = {
  type: "pie";
  id: string;
  dataKey?: string;
  nameKey?: string;
  /** px, or `"NN%"` of half the shorter side. Rose default `"12%"`. */
  innerRadius?: number | string;
  /** px, or `"NN%"` of half the shorter side. Pie default `"70%"`, rose `"92%"`. */
  outerRadius?: number | string;
  /** Slice name labels. Pie default true; rose default false. */
  showLabels?: boolean;
  /** Draw a rose (custom signature geometry) instead of a plain pie. */
  rose?: PieRose;
  sort?: PieSort;
  /** Rose: even seam between slices in px. Default the signature seam (`--chart-gap`, 2px). */
  gap?: number;
  /** Rose: slice corner radius in px. Default the signature surface radius (11px). */
  cornerRadius?: number;
};
export type HeatmapPart = {
  type: "heatmap";
  id: string;
  dataKey: string;
  cells?: Array<{ row: string; col: string; x: number; y: number; value: number }>;
  xLabels?: string[];
  yLabels?: string[];
  min?: number;
  max?: number;
  enableZoom?: boolean;
};

/** One column per category; filled tiles stack from the baseline up to the value. */
export type TileColumnPart = {
  type: "tileColumn";
  id: string;
  dataKey: string;
  /** Source rows — live on the part, same as heatmap `cells`. */
  rows?: Array<Record<string, unknown>>;
  /** Category column key on each row. Default `"date"`. */
  categoryKey?: string;
  /** Numeric measure key on each row. Default `"value"`. */
  valueKey?: string;
  /**
   * Band edges low → high. Row count is `bands.length - 1`. When omitted,
   * `bandCount` (default 8) spans 0 → max value.
   */
  bands?: number[];
  /** Used when `bands` is omitted. Default 8. */
  bandCount?: number;
  /**
   * Config keys for discrete fill steps (bottom → top). When omitted, colors
   * come from `dataKey` stops via `resolveColor(dataKey, stepIndex)`.
   */
  steps?: string[];
  /** Corner radius of each tile in px. Default: signature `radius.mark`. */
  cellRadius?: number;
  /** Gap between tiles in px (inset). Default: signature `gap.seam`. */
  cellGap?: number;
  /** Category labels for the x-axis. Default: string of each category value. */
  xLabels?: string[];
  /**
   * Which x indices keep a tick label. Default: first and last only.
   * Pass every index to show all.
   */
  xLabelIndices?: number[];
  /**
   * Formatter for y-axis band-edge labels. Default: bare number, `$Nk` when ≥1000.
   */
  yTickFormatter?: (band: number) => string;
};

export type CalendarPart = {
  type: "calendar";
  id: string;
  dataKey: string;
  cells?: Array<{
    date: string;
    value: number;
    assignedHours: number;
    availableHours: number;
  }>;
  range?: string | [string, string];
  min?: number;
  max?: number;
  cellSize?: number | "auto" | (number | "auto")[];
  orient?: "horizontal" | "vertical";
  showDayLabel?: boolean;
};
export type GaugePart = {
  type: "gauge";
  id: string;
  dataKey: string;
  nameKey?: string;
  min?: number;
  max?: number;
  target?: number;
  /** `chartConfig` key for target marker color/label. Default `"target"`. */
  targetKey?: string;
};

/** Sankey node. Omit `nodes` on the part to derive them from the link rows. */
export type SankeyNode = { name: string; [key: string]: unknown };
export type SankeyOrient = "horizontal" | "vertical";
export type SankeyNodeAlign = "justify" | "left" | "right";
/** Link fill: the source node's colour, or a source → target gradient. */
export type SankeyLinkColor = "source" | "gradient";

/** Sankey flow — links are the root `data` rows; everything else lives here. */
export type SankeyPart = {
  type: "sankey";
  id: string;
  sourceKey?: string;
  targetKey?: string;
  valueKey?: string;
  nodes?: SankeyNode[];
  orient?: SankeyOrient;
  nodeAlign?: SankeyNodeAlign;
  /** Node thickness in px. Default 12. */
  nodeWidth?: number;
  /** Space between nodes of one column in px. Default the signature `gap.stage`. */
  nodeGap?: number;
  showLabels?: boolean;
  linkColor?: SankeyLinkColor;
  formatValue?: (value: number) => string;
};

export type TooltipPart = {
  type: "tooltip";
  id: string;
  variant?: "default" | "frosted-glass";
  roundness?: "sm" | "md" | "lg" | "xl";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  hide?: boolean;
};

export type LegendPart = {
  type: "legend";
  id: string;
  variant?: string;
  isClickable?: boolean;
  align?: "left" | "center" | "right";
  hide?: boolean;
  /**
   * The focused series key, controlled or uncontrolled. Registered as part
   * state so the selection reaches the compiler — without it the legend can
   * only restyle itself, and clicking an entry dims the label while the plot
   * carries on as if nothing happened.
   */
  selected?: string | null;
};

export type ChartPart =
  | GridPart
  | XAxisPart
  | YAxisPart
  | BarSeriesPart
  | LineSeriesPart
  | WhiskersPart
  | ConnectorPart
  | AreaSeriesPart
  | ScatterSeriesPart
  | ReferenceLinePart
  | ReferenceBandPart
  | RangeAreaPart
  | RadarSeriesPart
  | PolarAngleAxisPart
  | PolarGridPart
  | FunnelPart
  | FunnelStylePart
  | WaterfallPart
  | TreemapPart
  | TreemapStylePart
  | SparklinePart
  | RadialBarPart
  | BrushPart
  | PieSeriesPart
  | HeatmapPart
  | TileColumnPart
  | CalendarPart
  | GaugePart
  | SankeyPart
  | TooltipPart
  | LegendPart;

/** Cartesian bar/line/area/composed/waterfall layout and brush options. */
export type CartesianCompileConfig = {
  layout?: BarLayout;
  stackType?: StackType;
  variant?: string;
  /** Default corner radius for all `<Bar />` series (px). */
  barRadius?: number;
  /** Footer `NQChartBrush` is active — use tighter cartesian grid margins. */
  externalBrush?: boolean;
  /** Monospace bars: false = intro expanded width, true = collapsed thin rest state. */
  monospaceCollapsed?: boolean;
  /** Hovered category index for monospace width expand. */
  monospaceHoveredIndex?: number | null;
};

/** Radial / polar gauge layout options. */
export type RadialCompileConfig = {
  radialVariant?: "full" | "semi";
  /** `concentric` — arc per ring; `rose` — nightingale petals from center. */
  radialLayout?: "concentric" | "rose";
  radialInnerRadius?: number | string;
  radialOuterRadius?: number | string;
  /**
   * Polar start angle in degrees (ECharts: 0 = 3 o'clock, 90 = 12 o'clock).
   * Defaults: full `90`, semi `180`. Sweep stays 360° / 180° clockwise.
   */
  radialStartAngle?: number;
};

/** Funnel stage wiring and visual presets. */
/** Native trapezoid / pipe inside-label content. */
export type FunnelLabel = "name-value" | "value";

export type FunnelCompileConfig = {
  stageKey?: string;
  valueKey?: string;
  /**
   * Optional field used only for stage *width*. Label still shows `valueKey`.
   * Stage silhouette — not a quantitative funnel. Omit to size by `valueKey`.
   */
  sizeKey?: string;
  /** Inside label format. Default `"name-value"` (`{b}\\n{c}`). */
  label?: FunnelLabel;
  /** Funnel stage spacing in px (overrides connection preset gap). */
  stageGap?: number;
  funnelConnection?: FunnelConnection;
  funnelTaper?: FunnelTaper;
  orient?: FunnelOrient;
  /** Native / rounded funnel stage order. Default `none` preserves `data` order. */
  sort?: FunnelSort;
  turnRadius?: number;
  showLabels?: boolean;
  /**
   * Corner softness (px). Works on native + rounded; custom path when > 0.
   * Independent of `sideCurve`.
   */
  cornerRadius?: number;
  /**
   * Side-wall bow for soft stages (0–1, default 0). Opt-in; pair with cornerRadius.
   */
  sideCurve?: number;
  /** Rim depth as a fraction of edge width (0–0.2). Default 0.03 for rounded, else 0. */
  rimDepth?: number;
  /** Radius (px) of corners facing a gap. Default 3, clamped to `cornerRadius`. */
  innerCornerRadius?: number;
  /** Cone rim ellipse height / width (0–0.5). Default 0.18. */
  coneTilt?: number;
  /** Cone top-face look. Default `"hollow"`. */
  coneStyle?: FunnelConeStyle;
  /** Format the numeric inside-label value (still uses `valueKey`). */
  formatValue?: (value: number) => string;
};

export type CompileContext<TData extends Record<string, unknown> = Record<string, unknown>> = {
  config: ChartConfig;
  data: TData[];
  parts: ChartPart[];
  chartId: string;
  resolveColor: (key: string, index?: number) => string;
  xDataKey?: string;
  nameKey?: string;
  valueKey?: string;
  valueDataKey?: string;
  cartesian?: CartesianCompileConfig;
  radial?: RadialCompileConfig;
  funnel?: FunnelCompileConfig;
  /**
   * Host canvas size in CSS px. Used by compilers that thin labels when the
   * view is too small (gauge axis ticks). Omitted → card-sized default.
   */
  viewport?: { width: number; height: number };
  /**
   * Hover-focus contract (default on). `false` keeps tooltip, disables sibling dim.
   * Sparkline / single-arc gauge stay tooltip-only either way.
   */
  hoverFocus?: boolean;
};
