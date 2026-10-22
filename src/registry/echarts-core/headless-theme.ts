/**
 * The headless theme registry.
 *
 * The chart id is the key to the chart's theme, in the DOM (`[data-chart=id]`) or
 * in the headless registry. A helper reads the registry only where it reads the DOM
 * today, so no helper signature moves and a browser consumer that registers no theme
 * sees the option it saw before.
 *
 * A Node caller (no `document`) wraps its compile call in {@link withHeadlessTheme};
 * the helpers that would read CSS custom properties from the chart container read
 * this theme instead of falling to their fixed defaults.
 */

/** Chart chrome colours. Same shape as `ChartChromeColors` in `resolve-chart-chrome.ts`. */
export type HeadlessChromeColors = {
  foreground: string;
  background: string;
  muted: string;
  border: string;
  splitLine: string;
  popover: string;
  popoverForeground: string;
};

/** Reference-mark tone colours. Same keys as `ReferenceTone` in `reference-marks.ts`. */
export type HeadlessToneColors = {
  neutral: string;
  accent: string;
  positive: string;
  warning: string;
  critical: string;
};

export type HeadlessTheme = {
  /** The `.dark` class on `<html>` in the browser. */
  isDark: boolean;
  /** Concrete colours (hex or rgb); ECharts in Node cannot resolve CSS variables. */
  chrome: HeadlessChromeColors;
  tones: HeadlessToneColors;
  /**
   * CSS custom properties by name, e.g. `"--metric-plan": "#1d4ed8"`. Resolves a
   * `var(--x)` colour in the chart config, through chains of `var()`.
   */
  tokens?: Record<string, string>;
  /** The value of `--radius` in px; `null` keeps the build-time default. */
  radiusPx: number | null;
  /** The `--font-sans` stack the chart text uses. */
  fontFamily: string;
  /** `false` compiles a static option (no intro tweens), for a print or an image. */
  animation: boolean;
};

const registry = new Map<string, HeadlessTheme>();

/** The theme registered for this chart id, or `undefined` (the browser path). */
export function headlessThemeOf(chartId: string | undefined): HeadlessTheme | undefined {
  if (chartId === undefined || registry.size === 0) return undefined;
  return registry.get(chartId);
}

/**
 * Register `theme` for `chartId` while `fn` runs, then remove it.
 *
 * Compile inside `fn`: `withHeadlessTheme(id, theme, () => compileComposedOption(ctx))`
 * with `ctx.chartId === id`. The registration does not outlive the call, so two
 * renders with different themes never see each other's theme.
 */
export function withHeadlessTheme<T>(chartId: string, theme: HeadlessTheme, fn: () => T): T {
  const previous = registry.get(chartId);
  registry.set(chartId, theme);
  try {
    return fn();
  } finally {
    if (previous) registry.set(chartId, previous);
    else registry.delete(chartId);
  }
}

/** Resolve a `var(--x)` chain through the theme tokens. Returns the input when no token matches. */
export function resolveTokenColor(value: string, tokens: Record<string, string> | undefined): string {
  const pattern = /^var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,\s*(.+))?\)$/;
  let current = value.trim();
  // A bounded walk: a token cycle must not hang the compile.
  for (let depth = 0; depth < 16; depth++) {
    const match = pattern.exec(current);
    if (!match) return current;
    const next = tokens?.[match[1]!];
    if (next !== undefined && next.trim()) {
      current = next.trim();
      continue;
    }
    // `var(--x, fallback)`: use the fallback when the token is not known.
    if (match[2] !== undefined) {
      current = match[2].trim();
      continue;
    }
    return current;
  }
  return current;
}
