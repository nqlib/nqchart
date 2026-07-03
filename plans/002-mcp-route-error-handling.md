# Plan 002 — Make the /mcp JSON-RPC endpoint return protocol errors instead of crashing

- **Status:** TODO
- **Written against commit:** `f43ccf9` (branch `landing-redesign-and-theme`)
- **Effort:** S · **Risk of change:** low · **Priority:** 2

## Why this matters

`src/app/mcp/route.ts` is a public, unauthenticated MCP (Model Context Protocol) endpoint exposing two tools (`search_docs`, `read_doc`) over JSON-RPC 2.0 so AI agents can query the NQChart docs. Three failure paths currently escape as unhandled exceptions → Next.js returns a generic 500 instead of a JSON-RPC error object, which breaks MCP clients:

1. **Malformed JSON body** — `route.ts:158`: `const body = (await request.json()) as JsonRpcRequest;` is unguarded. Any non-JSON POST throws `SyntaxError`.
2. **Unknown doc path** — `route.ts:77-78`: `readDoc` throws `new Error(\`No documentation page found for path: ${path}\`)`, and the caller `handleToolCall` (`route.ts:134-141`) has no try/catch.
3. **Any page-read failure during search** — `route.ts:93-106`: `searchDocs` maps all pages through `Promise.all`; one rejection fails the whole call uncaught.

Note for context: there is **no path traversal risk** here — `getPageByPath` (`route.ts:64-72`) only does a `.find()` over the fumadocs page list; user input never reaches the filesystem. This plan is purely about error handling and protocol compliance. Do not add path sanitization.

## Environment / verification commands

- Package manager: pnpm 10.12.1. Gates: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- Manual verification uses `next dev` + curl (commands in Done criteria).
- If Plan 001 (Vitest baseline) has landed, also add the unit test described in the Test plan section. If `pnpm test` doesn't exist yet, skip the unit test and note that in your report.

## Current state (verified excerpt, route.ts:157-181)

```ts
export async function POST(request: Request) {
  const body = (await request.json()) as JsonRpcRequest;

  if (body.id === undefined || body.id === null) {
    return new Response(null, { status: 202 });
  }

  switch (body.method) {
    case "initialize":
      // ...returns jsonRpcResult
    case "tools/list":
      return jsonRpcResult(body.id, { tools });
    case "tools/call":
      return handleToolCall(body);
    default:
      return jsonRpcError(body.id, -32601, `Method not found: ${body.method ?? "missing"}`);
  }
}
```

Existing helpers you must reuse (route.ts:49-62): `jsonRpcResult(id, result)` and `jsonRpcError(id, code, message)`. `jsonRpcError` currently maps code `-32601` → HTTP 404, everything else → HTTP 400.

## Repo conventions

- This file uses plain `Response.json(...)`, named functions, no classes, double quotes, semicolons. Match it exactly. No new dependencies, no zod — keep validation hand-rolled like the existing `typeof args.query === "string"` checks (route.ts:126, 135).

## Steps

### Step 1 — Guard JSON parsing in POST

Wrap the body parse; on failure return JSON-RPC parse error per spec (code `-32700`, id `null`):

```ts
export async function POST(request: Request) {
  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return jsonRpcError(null, -32700, "Parse error: request body is not valid JSON");
  }
  // ...existing logic unchanged
}
```

`jsonRpcError`'s `id` parameter is typed `JsonRpcRequest["id"]` which already includes `null` — no type change needed.

**Verify:** `pnpm exec tsc --noEmit` passes.

### Step 2 — Catch tool-call failures in handleToolCall

Wrap the two tool branches so any thrown error becomes a JSON-RPC error. Per JSON-RPC, a server-side execution failure is `-32603` (Internal error); a known-bad argument (doc not found) is better expressed as a **tool result with `isError: true`** per MCP convention, but keep it simple and consistent with this codebase: return `-32603` with the error message for unexpected failures, and for the not-found case return `-32602` (Invalid params) with the message from the thrown error.

Concretely, in `handleToolCall` (route.ts:121-144):

```ts
  if (name === "read_doc") {
    const path = typeof args.path === "string" ? args.path : "";
    try {
      const content = await readDoc(path);
      return jsonRpcResult(request.id, {
        content: [{ type: "text", text: content }],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to read document";
      return jsonRpcError(request.id, -32602, message);
    }
  }
```

And wrap the `search_docs` branch's `await searchDocs(query)` in try/catch returning `-32603` with a generic `"Search failed"` message (do not echo internal error details for the search path — page-read failures may contain file paths).

**Verify:** `pnpm exec tsc --noEmit` && `pnpm lint`.

### Step 3 — Make searchDocs resilient to single-page failures

In `searchDocs` (route.ts:91-119), a single unreadable page should not kill the whole search. Inside the `.map(async (page) => { ... })` callback, wrap the body in try/catch and return `null` on failure; then filter:

```ts
  const pages = await Promise.all(
    getAgentDocPages().map(async (page) => {
      try {
        const raw = await page.data.getText("raw");
        const markdown = processMdxForLLMs(raw);
        // ...existing scoring logic
        return { page, score, snippet };
      } catch {
        return null;
      }
    }),
  );

  return pages
    .filter((result): result is NonNullable<typeof result> => result !== null && result.score > 0)
    // ...existing sort/slice/map unchanged
```

**Verify:** `pnpm exec tsc --noEmit`.

## Done criteria (machine-checkable)

Run `pnpm dev` in the background, wait for ready, then:

1. Malformed JSON →
   `curl -s -X POST localhost:3000/mcp -H 'content-type: application/json' -d 'not-json'`
   returns HTTP 400 with body containing `"code":-32700` (NOT an HTML 500 page).
2. Unknown doc →
   `curl -s -X POST localhost:3000/mcp -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"read_doc","arguments":{"path":"/docs/does-not-exist"}}}'`
   returns a JSON-RPC error object containing `"code":-32602`, HTTP status 400.
3. Happy paths unchanged:
   - `{"method":"tools/list","id":1}` still returns the two tools.
   - `read_doc` with `{"path":"/docs/installation"}` (confirm an existing page URL via `ls src/content/docs` first; adjust path to a real page) returns content.
   - `search_docs` with `{"query":"bar"}` returns ≥1 result.
4. `pnpm lint && pnpm exec tsc --noEmit && pnpm build` all exit 0.

Kill the dev server when done.

## Scope boundaries

- **In scope:** `src/app/mcp/route.ts` only (plus an optional test file, below).
- **Out of scope:** `src/lib/agent-docs.ts`, `src/lib/llm.ts`, `/llm/*` and `/llms.txt` routes, auth/rate-limiting (deliberately not added — the endpoint serves public docs; revisit only if abuse appears), the `dynamic = "force-static"` / `revalidate` exports at the top of the file (leave untouched), MCP protocol upgrades (protocolVersion stays "2025-06-18").

## Test plan (only if Vitest exists from Plan 001)

The route handlers import from `@/lib/agent-docs` which reaches into fumadocs `source` — unit-testing the full POST handler requires mocking. Keep it minimal: extract nothing; instead add `src/app/mcp/__tests__/route.test.ts` that calls `POST(new Request("http://test/mcp", { method: "POST", body: "not-json" }))` and asserts status 400 + `error.code === -32700`. If importing the route module fails in node test env because of fumadocs/source side effects, STOP on the test (ship the fix without the unit test) and note it.

## Escape hatches — STOP and report if:

- The route module cannot even build after edits because `jsonRpcError(null, ...)` conflicts with a stricter type than documented here — report the actual type of `JsonRpcRequest["id"]`.
- You discover the route is statically evaluated in a way that makes POST unreachable in production (`dynamic = "force-static"` interactions). Do not change those exports; report what you observe from `pnpm build` output.

## Maintenance note

If more tools are added to this endpoint, the per-tool try/catch pattern from Step 2 must be applied to each. A future improvement (not this plan) is migrating to the official `@modelcontextprotocol/sdk` server, which handles JSON-RPC framing/errors itself — if that happens, this hand-rolled handling is superseded.
