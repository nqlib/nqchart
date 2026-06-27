import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/source", () => ({
  source: { pageTree: { children: [] } },
}));

vi.mock("@/registry/__index__", () => ({
  Index: {},
}));

import { processMdxForLLMs } from "../llm";

describe("processMdxForLLMs", () => {
  it("converts StepTitle to markdown heading", () => {
    const result = processMdxForLLMs("<StepTitle>Install</StepTitle>");
    expect(result).toContain("### Install");
  });

  it("converts ApiRow to structured markdown", () => {
    const result = processMdxForLLMs(
      '<ApiRow name="dataKey" type="string" required>The key.</ApiRow>',
    );
    expect(result).toContain("### `dataKey` (required)");
    expect(result).toContain("type: `string`");
    expect(result).toContain("The key.");
  });

  it("converts Link to markdown link", () => {
    const result = processMdxForLLMs('<Link href="/docs/bar">Bar docs</Link>');
    expect(result).toBe("[Bar docs](/docs/bar)");
  });

  it("removes TabsList but keeps TabsPanel content", () => {
    const result = processMdxForLLMs(`
<TabsList>hidden tab labels</TabsList>
<TabsPanel>visible panel body</TabsPanel>
`);
    expect(result).not.toContain("hidden tab labels");
    expect(result).toContain("visible panel body");
  });

  it("passes plain markdown through unchanged", () => {
    const input = "# Hello\n\nSome **bold** text.";
    expect(processMdxForLLMs(input)).toBe(input);
  });
});
