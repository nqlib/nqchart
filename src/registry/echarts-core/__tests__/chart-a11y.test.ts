import { describe, expect, it } from "vitest";
import { derivePieSeriesKeys, deriveSeriesKeysFromConfig } from "../chart-a11y";

describe("derivePieSeriesKeys", () => {
  const rows = [
    { name: "Alpha", value: 40 },
    { name: "Beta", value: 35 },
  ];

  it("keys the table off the value column, not slice names in config", () => {
    expect(derivePieSeriesKeys(rows, "name")).toEqual(["value"]);
  });

  it("honours an explicit value key", () => {
    expect(derivePieSeriesKeys([{ name: "A", amount: 10 }], "name", "amount")).toEqual([
      "amount",
    ]);
  });

  it("falls back to the first non-name column when value is absent", () => {
    expect(derivePieSeriesKeys([{ name: "A", count: 3 }], "name")).toEqual(["count"]);
  });
});

describe("deriveSeriesKeysFromConfig (cartesian — not pie)", () => {
  it("still uses config keys for cartesian rows", () => {
    const config = {
      planned: { label: "Planned" },
      actual: { label: "Actual" },
    };
    const data = [{ month: "2026-05", planned: 460_000, actual: null }];
    expect(deriveSeriesKeysFromConfig(config, data, "month")).toEqual(["planned", "actual"]);
  });
});
