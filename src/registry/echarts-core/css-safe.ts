/**
 * CSS-safe names and values for chart colours.
 *
 * Config keys, series names and chart ids can come from data (CRM fields, grid
 * columns), and they end up in three places that do not escape for us:
 * custom property names (`--color-<key>-<n>`), the `<style>` element
 * `ChartStyle` writes, and the `style="…"` attribute of ECharts' HTML tooltip.
 * Everything that writes or reads a chart colour variable goes through here,
 * so the definition and every use always agree.
 *
 * Keys made only of `[A-Za-z0-9_-]` are unchanged — `--color-revenue-0` stays
 * `--color-revenue-0`. Anything else is encoded as `_x<hex>_`, so a key with a
 * space (which never produced a valid property before) now works, and a key
 * with `"`, `;`, `}` or `<` can no longer break out of a declaration, rule,
 * attribute or the `<style>` element.
 */

/** Config key → a fragment that is valid inside a CSS custom property name. */
export function cssVarKey(key: string): string {
  return key.replace(/[^A-Za-z0-9_-]/g, (ch) => `_x${ch.codePointAt(0)!.toString(16)}_`);
}

/** `--color-<key>-<index>` for a config key. */
export function chartColorVarName(key: string, index: number): string {
  return `--color-${cssVarKey(key)}-${index}`;
}

/** `var(--color-<key>-<index>)` for a config key. */
export function chartColorVar(key: string, index: number): string {
  return `var(${chartColorVarName(key, index)})`;
}

/** Fill for a swatch: one colour, or a left→right gradient across `count`. */
export function chartColorFill(key: string, count: number): string {
  if (count <= 1) return chartColorVar(key, 0);
  const stops = Array.from({ length: count }, (_, i) => `${chartColorVar(key, i)} ${(i / (count - 1)) * 100}%`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/**
 * A chart id usable unquoted in `[data-chart=…]` and as an attribute value.
 * React ids (`:r1:`) and app ids (`revenue-q3`) pass through apart from the
 * characters a selector cannot hold.
 */
export function safeChartId(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "-");
}

/**
 * A CSS colour value, or `null` when it could be anything else. Accepts hex,
 * named colours and the functional forms (`rgb()`, `hsl()`, `oklch()`,
 * `color-mix(in oklab, …)`, `var(--token)`); rejects `;`, `{`, `}`, `<`, `>`,
 * quotes, backslashes and `url(` — what it takes to end a declaration, open a
 * rule, close the `<style>` element or fetch a resource.
 */
export function safeCssColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v || v.length > 200) return null;
  if (!/^[A-Za-z0-9#%.,()\s+\-/*]+$/.test(v)) return null;
  if (/url\s*\(/i.test(v)) return null;
  return v;
}
