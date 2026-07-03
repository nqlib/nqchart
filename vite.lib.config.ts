import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// @nqlib/nqchart — library build.
//
// becocharts ships as a shadcn-style compound-component library. Each chart
// family (bar, area, line, …) defines its OWN scoped sub-parts (Bar, XAxis,
// Tooltip, …), so a single flat barrel would collide on those names. We build
// one entry per chart family + a root entry for the shared chart context/types
// and reusable ui primitives. Consumers import per family:
//
//   import { NQBarChart, Bar, XAxis } from "@nqlib/nqchart/bar-chart"
//   import { ChartConfig, useChart } from "@nqlib/nqchart"
//
// echarts-core internals are bundled from source into each entry. react /
// react-dom / echarts / motion are peer deps, kept external.

const CHART_FAMILIES = [
  "area-chart",
  "bar-chart",
  "calendar-chart",
  "composed-chart",
  "funnel-chart",
  "heatmap-chart",
  "line-chart",
  "pie-chart",
  "radar-chart",
  "radial-chart",
  "scatter-chart",
  "sparkline-chart",
  "treemap-chart",
  "waterfall-chart",
];

const entry: Record<string, string> = {
  index: path.resolve(__dirname, "src/lib/public.ts"),
};
for (const family of CHART_FAMILIES) {
  entry[family] = path.resolve(__dirname, `src/registry/charts/${family}.tsx`);
}

export default defineConfig({
  plugins: [react()],
  // Do NOT copy the Next.js app's public/ dir into the library dist/. Vite's
  // publicDir defaults to "public", which would dump og images, registry JSON,
  // and svgs into the npm tarball. This is a library build — assets ship via
  // the app/docs site, not the package.
  publicDir: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry,
      name: "NQChart",
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "mjs" : "cjs"}`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "echarts",
        /^echarts\//,
        "motion",
        /^motion\//,
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          echarts: "echarts",
        },
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
