import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.slice(0, 120) ?? "BeeCharts";
  const description =
    searchParams.get("description")?.slice(0, 200) ??
    "Composable React charts for dashboards and BI";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          color: "#f8fafc",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🐝
          </div>
          <span style={{ fontSize: 28, fontWeight: 600 }}>BeeCharts</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }}>
            {title}
          </div>
          <div style={{ fontSize: 26, color: "#94a3b8", lineHeight: 1.4 }}>{description}</div>
        </div>
        <div style={{ fontSize: 20, color: "#64748b" }}>beecharts.dev</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
