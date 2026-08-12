import { describe, expect, it, vi } from "vitest";
import { createChartHandle } from "../chart-handle";

describe("createChartHandle", () => {
  it("returns empty string when there is no instance", () => {
    const handle = createChartHandle(() => null);
    expect(handle.toDataURL()).toBe("");
  });

  it("forwards getDataURL with themed background and opts", () => {
    const getDataURL = vi.fn(() => "data:image/png;base64,abc");
    const handle = createChartHandle(() => ({ getDataURL }) as never, undefined);
    expect(handle.toDataURL({ type: "svg", pixelRatio: 3 })).toBe("data:image/png;base64,abc");
    expect(getDataURL).toHaveBeenCalledWith({
      type: "svg",
      pixelRatio: 3,
      backgroundColor: "#ffffff",
    });
  });

  it("exposes getInstance", () => {
    const instance = { getDataURL: () => "" } as never;
    const handle = createChartHandle(() => instance);
    expect(handle.getInstance()).toBe(instance);
  });
});
