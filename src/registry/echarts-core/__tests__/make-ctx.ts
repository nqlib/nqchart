import type { CompileContext } from "../parts/types";

export function makeCtx(overrides: Partial<CompileContext> = {}): CompileContext {
  return {
    chartId: "test-chart",
    config: {},
    data: [],
    parts: [],
    resolveColor: (key: string, index = 0) => `color(${key},${index})`,
    ...overrides,
  };
}
