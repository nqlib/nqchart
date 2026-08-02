import { describe, expect, it } from "vitest";
import { buildPipeLayout } from "../funnel-pipe-geometry";

describe("buildPipeLayout", () => {
  const stages = [
    { value: 255 },
    { value: 248 },
    { value: 234 },
    { value: 205 },
    { value: 55 },
  ];

  it("builds a horizontal closed path with cubic joins and square ends", () => {
    const layout = buildPipeLayout(stages, {
      width: 800,
      height: 160,
      orient: "horizontal",
    });
    expect(layout.orient).toBe("horizontal");
    expect(layout.stageCount).toBe(5);
    expect(layout.stageSpan).toBe(160);
    expect(layout.pathData.startsWith("M ")).toBe(true);
    expect(layout.pathData.endsWith("Z")).toBe(true);
    // Radius only at level joins — no stadium end-cap arcs by default.
    expect(layout.pathData).toContain(" C ");
    expect(layout.pathData).not.toMatch(/\bA\b/);
    expect(layout.stagePaths).toHaveLength(5);
    expect(layout.stagePaths.every((p) => p.endsWith("Z"))).toBe(true);
    expect(layout.stageInset[0]!).toBeLessThan(layout.stageInset[4]!);
    expect(layout.stageThickness[0]!).toBeGreaterThan(layout.stageThickness[4]!);
  });

  it("adds end-cap arcs only when capRadius > 0", () => {
    const layout = buildPipeLayout(stages, {
      width: 800,
      height: 160,
      capRadius: 8,
    });
    expect(layout.pathData).toMatch(/\bA\b/);
  });

  it("builds a vertical pipe with flow along Y", () => {
    const layout = buildPipeLayout(stages, {
      width: 200,
      height: 500,
      orient: "vertical",
    });
    expect(layout.orient).toBe("vertical");
    expect(layout.stageCount).toBe(5);
    expect(layout.stageSpan).toBe(100);
    expect(layout.stagePaths).toHaveLength(5);
    // Wider stages sit closer to x=0 (smaller inset).
    expect(layout.stageInset[0]!).toBeLessThan(layout.stageInset[4]!);
    // Vertical paths should move in y across stage rows.
    expect(layout.pathData).toMatch(/M [\d.]+ [\d.]+/);
  });

  it("clamps turnRadius into a usable transition width", () => {
    const tight = buildPipeLayout(stages, { width: 500, height: 120, turnRadius: 4 });
    const wide = buildPipeLayout(stages, { width: 500, height: 120, turnRadius: 80 });
    expect(tight.pathData).not.toBe(wide.pathData);
    expect(tight.pathData.length).toBeGreaterThan(0);
  });

  it("keeps joins tight — curve starts near the boundary, not mid-stage", () => {
    // Vertical short stages: turnRadius=6 → 12px join (~4% of span before boundary).
    const layout = buildPipeLayout(stages, {
      width: 200,
      height: 280,
      orient: "vertical",
      turnRadius: 6,
    });
    const span = 280 / 5;
    const boundary = 4 * span; // Offer→Hired
    const joinStart = boundary - 6 * 2 * 0.35; // JOIN_UPSTREAM_SHARE
    expect(joinStart).toBeGreaterThan(boundary - span * 0.25);
    // Vertical: near-edge point is `L <inset> <flow>` — flow must hit joinStart.
    expect(layout.pathData).toContain(` ${joinStart} C `);
  });

  it("returns empty layout for empty input", () => {
    expect(buildPipeLayout([], { width: 100, height: 100 }).pathData).toBe("");
  });
});
