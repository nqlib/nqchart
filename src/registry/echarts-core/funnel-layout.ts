import type {
  FunnelConnection,
  FunnelOrient,
  FunnelStylePart,
  FunnelTaper,
} from "./parts/types";
import type { CompileContext } from "./parts/types";

/** Vertical spacing + dividers between funnel stages (native trapezoid funnel). */
export const FUNNEL_CONNECTION = {
  /** Stages touch — no gap or segment border. */
  seamless: { gap: 0, borderWidth: 0 },
  /**
   * Stages touch (default). The border paints the chart *background* color, so
   * `gap` and `borderWidth` compound into one visible seam — 2px of border on
   * two facing edges reads as separation even at `gap: 0`. Both must be zero
   * for the funnel to read as a single tapering mark like pie/waterfall do.
   */
  default: { gap: 0, borderWidth: 0 },
  /** Clearly separated blocks. */
  segmented: { gap: 12, borderWidth: 2 },
  /**
   * Smooth ribbon with S-curve joins (custom series). Gap/border unused —
   * listed so the Record stays exhaustive for FunnelConnection.
   */
  pipe: { gap: 0, borderWidth: 0 },
} as const satisfies Record<
  FunnelConnection,
  { gap: number; borderWidth: number }
>;

/** How gradually stage widths taper (ECharts `minSize`). */
export const FUNNEL_TAPER = {
  soft: "22%",
  default: "12%",
  steep: "6%",
} as const satisfies Record<FunnelTaper, string>;

export type ResolvedFunnelLayout = {
  connection: FunnelConnection;
  orient: FunnelOrient;
  gap: number;
  borderWidth: number;
  minSize: string;
  turnRadius?: number;
  showLabels: boolean;
  isPipe: boolean;
};

export function resolveFunnelLayout(
  ctx: CompileContext,
  style: FunnelStylePart | undefined,
): ResolvedFunnelLayout {
  const connection = style?.connection ?? ctx.funnel?.funnelConnection ?? "default";
  const taper = style?.taper ?? ctx.funnel?.funnelTaper ?? "default";
  const isPipe = connection === "pipe";
  // Explicit orient wins. Pipe defaults horizontal; native funnel defaults vertical.
  const orient: FunnelOrient =
    style?.orient ?? ctx.funnel?.orient ?? (isPipe ? "horizontal" : "vertical");
  const preset = FUNNEL_CONNECTION[connection];
  const gap = style?.stageGap ?? ctx.funnel?.stageGap ?? preset.gap;
  const borderWidth = preset.borderWidth;
  const turnRadius = style?.turnRadius ?? ctx.funnel?.turnRadius;
  const showLabels = style?.showLabels ?? ctx.funnel?.showLabels ?? true;

  return {
    connection,
    orient,
    gap,
    borderWidth,
    minSize: FUNNEL_TAPER[taper],
    turnRadius,
    showLabels,
    isPipe,
  };
}
