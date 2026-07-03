import { describe, expect, it, vi } from "vitest";

const mockPages = [
  {
    url: "/docs/bar-chart/static",
    slugs: ["bar-chart", "static"],
    data: {
      title: "Bar Chart",
      description: "Compare categories",
      getText: async () => "# Bar\n\nBar chart body.",
    },
  },
];

vi.mock("@/lib/agent-docs", () => ({
  getAgentDocPages: () => mockPages,
}));

vi.mock("@/lib/source", () => ({
  source: { pageTree: { children: [] } },
}));

import { GET, POST } from "../route";

describe("POST /mcp", () => {
  it("returns JSON-RPC parse error for malformed JSON", async () => {
    const response = await POST(
      new Request("http://test/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { code: number; message: string } };
    expect(body.error.code).toBe(-32700);
    expect(body.error.message).toContain("Parse error");
  });

  it("lists tools via tools/list", async () => {
    const response = await POST(
      new Request("http://test/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      }),
    );

    const body = (await response.json()) as {
      result: { tools: Array<{ name: string }> };
    };
    expect(body.result.tools.map((t) => t.name)).toEqual(["search_docs", "read_doc"]);
  });

  it("returns error for unknown doc path via read_doc", async () => {
    const response = await POST(
      new Request("http://test/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "read_doc",
            arguments: { path: "/docs/missing" },
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { code: number; message: string } };
    expect(body.error.code).toBe(-32602);
    expect(body.error.message).toContain("No documentation page found");
  });

  it("returns empty results for empty search_docs query", async () => {
    const response = await POST(
      new Request("http://test/mcp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "search_docs",
            arguments: { query: "" },
          },
        }),
      }),
    );

    const body = (await response.json()) as {
      result: { content: Array<{ text: string }> };
    };
    const text = body.result.content[0]?.text ?? "[]";
    expect(JSON.parse(text)).toEqual([]);
  });
});

describe("GET /mcp", () => {
  it("exposes server metadata and tools", async () => {
    const response = await GET();
    const body = (await response.json()) as {
      name: string;
      tools: Array<{ name: string }>;
    };
    expect(body.name).toBe("nqchart-docs");
    expect(body.tools.length).toBe(2);
  });
});
