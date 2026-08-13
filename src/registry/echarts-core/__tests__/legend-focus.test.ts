import { describe, expect, it } from "vitest";
import type { EChartsOption } from "echarts";
import { withLegendFocus } from "../legend-focus";

type Styled = {
  id?: string;
  itemStyle?: { opacity?: number };
  lineStyle?: { opacity?: number; width?: number };
  areaStyle?: { opacity?: number };
  data?: Array<{ name?: string; itemStyle?: { opacity?: number } }>;
};

const seriesOf = (o: EChartsOption) => o.series as unknown as Styled[];
const opacities = (o: EChartsOption) => seriesOf(o).map((s) => s.itemStyle?.opacity);

const cartesian = (): EChartsOption => ({
  series: [
    { type: "bar", id: "planned", data: [1, 2] },
    { type: "bar", id: "actual", data: [3, 4] },
    { type: "line", id: "otd", data: [5, 6], lineStyle: { width: 2 } },
  ],
});

const on = { isClickable: true as const };

describe("withLegendFocus", () => {
  it("leaves charts whose legend cannot focus completely alone", () => {
    const o = cartesian();
    expect(withLegendFocus(o, undefined)).toBe(o);
    expect(withLegendFocus(o, { isClickable: false, selected: "actual" })).toBe(o);
  });

  it("dims every series except the selected one", () => {
    const o = withLegendFocus(cartesian(), { ...on, selected: "actual" });
    const [planned, actual, otd] = opacities(o);
    expect(planned).toBeLessThan(1);
    expect(actual).toBe(1);
    expect(otd).toBeLessThan(1);
  });

  /**
   * The bug this guards: `setOption` merges, so a series faded by the previous
   * selection keeps that opacity unless the next option says otherwise. Select
   * two entries in a row and the whole chart ends up dimmed.
   */
  it("states full opacity explicitly so a merge cannot keep a stale dim", () => {
    const first = withLegendFocus(cartesian(), { ...on, selected: "actual" });
    expect(opacities(first)[1]).toBe(1);

    const second = withLegendFocus(cartesian(), { ...on, selected: "planned" });
    expect(opacities(second)).toEqual([1, expect.any(Number), expect.any(Number)]);
    expect(opacities(second)[0]).toBe(1);
    expect(opacities(second)[1]).toBeLessThan(1);
  });

  it("restores every series when the selection is cleared", () => {
    const cleared = withLegendFocus(cartesian(), { ...on, selected: null });
    // Omitting opacity would let the previous dim survive the merge.
    expect(opacities(cleared)).toEqual([1, 1, 1]);
  });

  it("keeps a deliberately translucent style instead of flattening it to 1", () => {
    const translucent: EChartsOption = {
      series: [
        { type: "line", id: "a", areaStyle: { opacity: 0.3 }, data: [1] },
        { type: "line", id: "b", data: [2] },
      ],
    };
    const o = withLegendFocus(translucent, { ...on, selected: "a" });
    expect(seriesOf(o)[0]?.areaStyle?.opacity).toBe(0.3);
  });

  it("dims a line's stroke as well as its marks, without losing its width", () => {
    const o = withLegendFocus(cartesian(), { ...on, selected: "planned" });
    expect(seriesOf(o)[2]?.lineStyle?.opacity).toBeLessThan(1);
    expect(seriesOf(o)[2]?.lineStyle?.width).toBe(2);
  });

  it("never dims reference lines and bands", () => {
    const withRef: EChartsOption = {
      series: [
        { type: "bar", id: "planned", data: [1] },
        { type: "line", id: "__nq_reference__", markLine: { data: [] } },
      ],
    };
    expect(seriesOf(withLegendFocus(withRef, { ...on, selected: "planned" }))[1]?.itemStyle)
      .toBeUndefined();
  });

  it("dims slices when a single series owns every legend key", () => {
    const pie: EChartsOption = {
      series: [
        {
          type: "pie",
          id: "share",
          data: [
            { name: "Alpha", value: 40 },
            { name: "Beta", value: 35 },
          ],
        },
      ],
    };
    const s = seriesOf(withLegendFocus(pie, { ...on, selected: "Beta" }));
    expect(s[0]?.data?.[0]?.itemStyle?.opacity).toBeLessThan(1);
    expect(s[0]?.data?.[1]?.itemStyle?.opacity).toBe(1);
    // The series itself must not be dimmed on top of its own slices.
    expect(s[0]?.itemStyle?.opacity).toBeUndefined();
  });

  it("restores slices when the selection is cleared", () => {
    const pie: EChartsOption = {
      series: [
        { type: "pie", id: "share", data: [{ name: "Alpha", value: 40 }, { name: "Beta", value: 35 }] },
      ],
    };
    const s = seriesOf(withLegendFocus(pie, { ...on, selected: null }));
    expect(s[0]?.data?.map((d) => d.itemStyle?.opacity)).toEqual([1, 1]);
  });

  it("ignores a key that belongs to no series", () => {
    const s = seriesOf(withLegendFocus(cartesian(), { ...on, selected: "nonexistent" }));
    // Better to change nothing than to fade a whole chart over a stale key.
    expect(s.every((x) => x.itemStyle?.opacity === undefined)).toBe(true);
  });

  it("keeps a collision-suffixed area bright when the legend key is the dataKey", () => {
    const fillUnder: EChartsOption = {
      series: [
        { type: "bar", id: "planned", data: [1] },
        { type: "line", id: "otd", data: [5], lineStyle: { width: 2 } },
        {
          type: "line",
          id: "otd__nq_area",
          name: "On-time delivery",
          data: [5],
          areaStyle: { opacity: 0.2 },
        },
      ],
    };
    const o = withLegendFocus(fillUnder, { ...on, selected: "otd" });
    const [planned, line, area] = seriesOf(o);
    expect(planned?.itemStyle?.opacity).toBeLessThan(1);
    expect(line?.itemStyle?.opacity).toBe(1);
    expect(area?.itemStyle?.opacity).toBe(1);
    expect(area?.areaStyle?.opacity).toBe(0.2);
  });
});
