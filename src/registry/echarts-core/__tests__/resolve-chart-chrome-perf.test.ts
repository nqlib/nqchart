import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Plan 022 regression guard: resolving canvas chrome must not insert/remove a
 * probe in the chart on every call. Each insert dirtied the document's styles,
 * so the next getComputedStyle forced a full recalc (quadratic on dashboards).
 */

type FakeEl = {
  style: Record<string, string>;
  dataset: Record<string, string>;
  isConnected: boolean;
  setAttribute: () => void;
};

function installFakeDom() {
  const chartAppends = vi.fn();
  const bodyAppends = vi.fn((el: FakeEl) => {
    el.isConnected = true;
  });
  const chartEl = { appendChild: chartAppends, removeChild: vi.fn() };
  const doc = {
    documentElement: { classList: { contains: () => false } },
    body: { appendChild: bodyAppends },
    querySelector: () => chartEl,
    createElement: (): FakeEl => ({
      style: {},
      dataset: {},
      isConnected: false,
      setAttribute: () => {},
    }),
  };
  vi.stubGlobal("document", doc);
  vi.stubGlobal("getComputedStyle", (el: FakeEl | unknown) => ({
    getPropertyValue: (name: string) => (name.startsWith("--") ? "oklch(0.5 0 0)" : ""),
    color: (el as FakeEl).style?.color ? "rgb(1, 2, 3)" : "",
  }));
  return { chartAppends, bodyAppends };
}

describe("resolveCanvasChartChrome — no per-call DOM probe", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it("resolves literal colors through one shared probe, never inside the chart", async () => {
    const { chartAppends, bodyAppends } = installFakeDom();
    const { resolveCanvasChartChrome } = await import("../resolve-chart-chrome");

    const a = resolveCanvasChartChrome("chart-a");
    const b = resolveCanvasChartChrome("chart-b");

    expect(a.foreground).toBe("rgb(1, 2, 3)");
    expect(b.background).toBe("rgb(1, 2, 3)");
    expect(chartAppends).not.toHaveBeenCalled();
    expect(bodyAppends).toHaveBeenCalledTimes(1);
  });
});
