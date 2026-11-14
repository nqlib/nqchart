import type {
  FunnelConeStyle,
  FunnelConnection,
  FunnelOrient,
  FunnelSort,
  FunnelStylePart,
  FunnelTaper,
} from "./parts/types";
import type { CompileContext } from "./parts/types";
import { CHART_SIGNATURE, resolveChartSignature } from "./chart-signature";
import { DEFAULT_CONE_TILT, MAX_CONE_TILT } from "./funnel-cone-geometry";
import {
  DEFAULT_RIM_DEPTH,
  DEFAULT_SIDE_CURVE,
  MAX_RIM_DEPTH,
} from "./funnel-rounded-geometry";

/**
 * Vertical spacing + dividers between funnel stages. Stage gaps come from the
 * signature (`gap.stage`); `default` / `seamless` / `pipe` stay at 0.
 */
function funnelConnectionPresets(stageGap: number) {
  return {
    /** Stages touch — no gap or segment border. */
    seamless: { gap: 0, borderWidth: 0 },
    /**
     * Stages touch (default). The border paints the chart *background* color, so
     * `gap` and `borderWidth` compound into one visible seam — 2px of border on
     * two facing edges reads as separation even at `gap: 0`. Both must be zero
     * for the funnel to read as a single tapering mark like pie/waterfall do.
     */
    default: { gap: 0, borderWidth: 0 },
    /** Clearly separated blocks — a real gap, no painted border. */
    segmented: { gap: stageGap, borderWidth: 0 },
    /**
     * Smooth ribbon with S-curve joins (custom series). Gap/border unused —
     * listed so the Record stays exhaustive for FunnelConnection.
     */
    pipe: { gap: 0, borderWidth: 0 },
    /**
     * Curved trapezoid stages (custom series): continuous taper, rim curves,
     * gaps. Corner radius defaults to the signature surface radius; rimDepth
     * 0.03; sideCurve 0 (opt-in bow).
     */
    rounded: { gap: stageGap, borderWidth: 0 },
    /** 3D cone slices (custom series). Gap is between rim center lines. */
    cone: { gap: stageGap, borderWidth: 0 },
  } as const satisfies Record<
    FunnelConnection,
    { gap: number; borderWidth: number }
  >;
}

/** Build-time presets (shipped tokens); `resolveFunnelLayout` reads the live signature. */
export const FUNNEL_CONNECTION = funnelConnectionPresets(CHART_SIGNATURE.gap.stage);

/** How gradually stage widths taper (ECharts `minSize` / rounded scale floor). */
export const FUNNEL_TAPER = {
  soft: "22%",
  default: "12%",
  steep: "6%",
} as const satisfies Record<FunnelTaper, string>;

/** Build-time default corner radius when `connection="rounded"` and `cornerRadius` is unset. */
export const FUNNEL_ROUNDED_DEFAULT_RADIUS = CHART_SIGNATURE.radius.surface;

export type ResolvedFunnelLayout = {
  connection: FunnelConnection;
  orient: FunnelOrient;
  sort: FunnelSort;
  gap: number;
  borderWidth: number;
  minSize: string;
  turnRadius?: number;
  showLabels: boolean;
  isPipe: boolean;
  /**
   * Custom soft-stage series. True for `connection="rounded"`, or when
   * `cornerRadius > 0` on a non-pipe connection (ECharts `borderRadius` does
   * not visibly round native funnel polygons).
   */
  isRounded: boolean;
  cornerRadius: number;
  sideCurve: number;
  /** Rim depth / edge width for custom soft stages (0 = flat rims). */
  rimDepth: number;
  /** Radius (px) of corners facing a gap in custom soft stages. 0 unless rounded. */
  innerCornerRadius: number;
  /** 3D cone slices (`connection="cone"`). Vertical only. */
  isCone: boolean;
  /** Cone rim ellipse height / width. 0 unless `isCone`. */
  coneTilt: number;
  coneStyle: FunnelConeStyle;
};

export function resolveFunnelLayout(
  ctx: CompileContext,
  style: FunnelStylePart | undefined,
): ResolvedFunnelLayout {
  const connection = style?.connection ?? ctx.funnel?.funnelConnection ?? "default";
  const taper = style?.taper ?? ctx.funnel?.funnelTaper ?? "default";
  const isPipe = connection === "pipe";
  const isCone = connection === "cone";
  const wantsRoundedConnection = connection === "rounded";
  // Explicit orient wins. Pipe defaults horizontal; native/rounded default vertical.
  const orient: FunnelOrient =
    style?.orient ?? ctx.funnel?.orient ?? (isPipe ? "horizontal" : "vertical");
  // Data order by default — value sort reorders pipeline stages when mid-stages grow.
  const sort: FunnelSort = style?.sort ?? ctx.funnel?.sort ?? "none";
  const signature = resolveChartSignature(ctx.chartId);
  const preset = funnelConnectionPresets(signature.gap.stage)[connection];
  const gap = style?.stageGap ?? ctx.funnel?.stageGap ?? preset.gap;
  const borderWidth = preset.borderWidth;
  const turnRadius = style?.turnRadius ?? ctx.funnel?.turnRadius;
  const showLabels = style?.showLabels ?? ctx.funnel?.showLabels ?? true;
  const rawCorner = style?.cornerRadius ?? ctx.funnel?.cornerRadius;
  const cornerRadius =
    rawCorner ?? (wantsRoundedConnection ? signature.radius.surface : 0);
  // Custom path whenever designers ask for radius on non-pipe (native ECharts
  // funnel borderRadius is visually weak). connection="rounded" always custom.
  const isRounded =
    !isPipe && !isCone && (wantsRoundedConnection || cornerRadius > 0);
  const rawSide = style?.sideCurve ?? ctx.funnel?.sideCurve;
  const sideCurve = isRounded
    ? Math.min(1, Math.max(0, rawSide ?? DEFAULT_SIDE_CURVE))
    : 0;
  // Curved rims are the `rounded` look; a native connection that only asked for
  // cornerRadius keeps flat rims unless rimDepth is set.
  const rawRim = style?.rimDepth ?? ctx.funnel?.rimDepth;
  const rimDepth = isRounded
    ? Math.min(
        MAX_RIM_DEPTH,
        Math.max(0, rawRim ?? (wantsRoundedConnection ? DEFAULT_RIM_DEPTH : 0)),
      )
    : 0;
  // Corners facing a gap stay small so the silhouette flows between layers.
  const rawInner = style?.innerCornerRadius ?? ctx.funnel?.innerCornerRadius;
  const innerCornerRadius = isRounded
    ? Math.max(0, rawInner ?? signature.radius.join)
    : 0;

  return {
    connection,
    orient,
    sort,
    gap,
    borderWidth,
    minSize: FUNNEL_TAPER[taper],
    turnRadius,
    showLabels,
    isPipe,
    isRounded,
    cornerRadius,
    sideCurve,
    rimDepth,
    innerCornerRadius,
    isCone,
    coneTilt: isCone
      ? Math.min(
          MAX_CONE_TILT,
          Math.max(0, style?.coneTilt ?? ctx.funnel?.coneTilt ?? DEFAULT_CONE_TILT),
        )
      : 0,
    coneStyle: style?.coneStyle ?? ctx.funnel?.coneStyle ?? "hollow",
  };
}
