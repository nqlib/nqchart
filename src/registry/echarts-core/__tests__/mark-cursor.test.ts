import { describe, expect, it } from "vitest";
import type { EChartsOption } from "echarts";
import { withMarkPointerCursor } from "../use-chart-interaction";

/**
 * The cursor is the only thing that tells a reader whether a mark is clickable
 * before they click it. ECharts defaults a series cursor to `"pointer"`, so
 * "leave it alone when nothing is bound" is not a neutral choice — it makes
 * every static chart advertise an interaction it does not have.
 */
describe("withMarkPointerCursor", () => {
  const option = (): EChartsOption => ({
    series: [
      { type: "bar", id: "planned", data: [1, 2] },
      { type: "line", id: "otd", data: [3, 4] },
    ],
  });

  const cursors = (o: EChartsOption) =>
    (o.series as Array<{ cursor?: string }>).map((s) => s.cursor);

  it("marks are pointer when a click handler is bound", () => {
    expect(cursors(withMarkPointerCursor(option(), true))).toEqual(["pointer", "pointer"]);
  });

  it("marks are default when no click handler is bound", () => {
    // Regression: this used to return the option untouched, leaving ECharts'
    // own `pointer` default on a chart that swallows every click.
    expect(cursors(withMarkPointerCursor(option(), false))).toEqual(["default", "default"]);
  });

  it("leaves reference marks alone", () => {
    const withRef: EChartsOption = {
      series: [
        { type: "bar", id: "planned", data: [1] },
        { type: "line", id: "__nq_reference__", markLine: { data: [] } },
      ],
    };
    expect(cursors(withMarkPointerCursor(withRef, true))).toEqual(["pointer", undefined]);
    expect(cursors(withMarkPointerCursor(withRef, false))).toEqual(["default", undefined]);
  });

  it("passes an option with no series straight through", () => {
    const empty: EChartsOption = { series: [] };
    expect(withMarkPointerCursor(empty, false)).toBe(empty);
  });
});
