import { describe, expect, it } from "vitest";
import { chartColorFill, chartColorVarName, cssVarKey, safeChartId, safeCssColor } from "../css-safe";
import { chartStyleCss } from "@/registry/ui/chart";

describe("cssVarKey", () => {
  it("leaves ordinary config keys unchanged", () => {
    expect(chartColorVarName("revenue", 0)).toBe("--color-revenue-0");
    expect(chartColorVarName("net_new-2", 3)).toBe("--color-net_new-2-3");
  });

  it("encodes characters a custom property cannot hold", () => {
    expect(cssVarKey("Desktop users")).toBe("Desktop_x20_users");
    const hostile = cssVarKey('a";}</style><b>');
    expect(hostile).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("builds single and gradient fills from the same names", () => {
    expect(chartColorFill("a b", 1)).toBe("var(--color-a_x20_b-0)");
    expect(chartColorFill("k", 3)).toBe(
      "linear-gradient(to right, var(--color-k-0) 0%, var(--color-k-1) 50%, var(--color-k-2) 100%)",
    );
  });
});

describe("safeCssColor", () => {
  it.each(["#10b981", "rgb(4 120 87 / 0.5)", "oklch(0.67 0.13 152)", "var(--chart-1)", "color-mix(in oklab, var(--primary) 40%, white)", "rebeccapurple"])(
    "accepts %s",
    (c) => expect(safeCssColor(c)).toBe(c),
  );

  it.each(["red; } body { display:none", "red</style><script>", 'red"', "url(https://x.test/a.png)", "{", "", 42, null])(
    "rejects %s",
    (c) => expect(safeCssColor(c)).toBeNull(),
  );
});

describe("ChartStyle sheet", () => {
  it("scopes rules to a sanitised chart id", () => {
    expect(safeChartId('x] body{color:red} [a')).toMatch(/^[A-Za-z0-9_-]+$/);
    const css = chartStyleCss('x"]{}</style>', () => "  --color-a-0: red;");
    expect(css).not.toContain("</style>");
    expect(css).not.toContain('"');
    expect(css).toContain("[data-chart=x------style-]");
  });
});
