import { describe, expect, it } from "vitest";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import {
  BAR_RADIUS_MIN,
  BAR_RADIUS_THICKNESS_RATIO,
  chartCornerCap,
  fitCornerRadius,
  fitBarCornersBeforePaint,
  fitRenderedBarCorners,
} from "../bar-radius";

echarts.use([BarChart, GridComponent, SVGRenderer]);

describe("chartCornerCap", () => {
  it("keeps the authored radius on bars of ordinary width", () => {
    expect(chartCornerCap(40, 6)).toBe(6);
    expect(chartCornerCap(24, 6)).toBe(6);
  });

  it("scales down on narrow bars, with a floor that never exceeds half the bar", () => {
    expect(chartCornerCap(16, 6)).toBe(16 * BAR_RADIUS_THICKNESS_RATIO);
    expect(chartCornerCap(6, 6)).toBe(BAR_RADIUS_MIN);
    expect(chartCornerCap(3, 6)).toBe(1.5);
    expect(chartCornerCap(0, 6)).toBe(0);
  });
});

describe("fitCornerRadius", () => {
  it("caps every corner at the chart cap; zeros stay zero", () => {
    expect(fitCornerRadius([6, 6, 0, 0], 4, 100)).toEqual([4, 4, 0, 0]);
    expect(fitCornerRadius([2, 2, 2, 2], 4, 100)).toEqual([2, 2, 2, 2]);
  });

  it("keeps thin segments rectangles, not pills", () => {
    // A 6px slice: corners ≤ 1.8px, not the 3px a half-length clamp would give.
    expect(fitCornerRadius([6, 6, 6, 6], 6, 6)).toEqual([1.8, 1.8, 1.8, 1.8].map((v) => expect.closeTo(v, 5)));
  });
});

function render(widthPx: number, categories: number) {
  const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: widthPx, height: 300 });
  chart.setOption({
    animation: false,
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: "category", data: Array.from({ length: categories }, (_, i) => `c${i}`) },
    yAxis: { type: "value", max: 100 },
    series: [
      { type: "bar", stack: "s", data: Array(categories).fill(90), itemStyle: { borderRadius: [0, 0, 2, 2] } },
      { type: "bar", stack: "s", data: Array(categories).fill(2), itemStyle: { borderRadius: [6, 6, 0, 0] } },
    ],
  });
  fitRenderedBarCorners(chart);
  type El = { shape: { r: number[]; width: number; height: number } };
  const model = (chart as unknown as { getModel(): { getSeriesByIndex(i: number): { getData(): { getItemGraphicEl(i: number): El } } } }).getModel();
  const base = model.getSeriesByIndex(0).getData().getItemGraphicEl(0);
  const cap = model.getSeriesByIndex(1).getData().getItemGraphicEl(0);
  chart.dispose();
  return { base, cap };
}

describe("fitRenderedBarCorners", () => {
  it("wide columns keep the signature radius", () => {
    const { cap } = render(600, 6);
    expect(cap.shape.width).toBeGreaterThan(24);
    expect(Math.max(...cap.shape.r)).toBeLessThanOrEqual(6);
    // The 2-unit slice is ~6px tall: length guard keeps it a rectangle.
    expect(Math.max(...cap.shape.r)).toBeLessThanOrEqual(Math.abs(cap.shape.height) * 0.3 + 1e-6);
  });

  it("narrow columns share one smaller cap", () => {
    const { base, cap } = render(300, 24);
    const expected = chartCornerCap(base.shape.width, 6);
    expect(expected).toBeLessThan(6);
    expect(Math.max(...base.shape.r)).toBeLessThanOrEqual(Math.min(2, expected) + 1e-6);
    expect(Math.max(...cap.shape.r)).toBeLessThanOrEqual(expected + 1e-6);
  });
});

describe("fitBarCornersBeforePaint", () => {
  it("re-fits corners a tween rewrote, before the frame is painted", () => {
    const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: 300, height: 300 });
    chart.setOption({
      animation: false,
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { type: "category", data: Array.from({ length: 24 }, (_, i) => `c${i}`) },
      yAxis: { type: "value", max: 100 },
      series: [{ type: "bar", data: Array(24).fill(80), itemStyle: { borderRadius: [8, 8, 0, 0] } }],
    });
    fitBarCornersBeforePaint(chart);
    type El = { shape: { r: number[]; width: number }; setShape(k: "r", v: number[]): void };
    const el = (chart as unknown as { getModel(): { getSeriesByIndex(i: number): { getData(): { getItemGraphicEl(i: number): El } } } })
      .getModel().getSeriesByIndex(0).getData().getItemGraphicEl(0);
    // What an intro/update tween does each frame: write the authored radius back.
    el.setShape("r", [8, 8, 0, 0]);
    (chart.getZr() as unknown as { painter: { refresh(): void } }).painter.refresh();
    expect(Math.max(...el.shape.r)).toBeLessThanOrEqual(chartCornerCap(el.shape.width, 8) + 1e-6);
    // Wrapping twice is a no-op.
    fitBarCornersBeforePaint(chart);
    chart.dispose();
  });
});
