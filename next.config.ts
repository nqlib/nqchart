import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "@carbon/icons-react"],
  },
  async redirects() {
    return [
      {
        source: "/docs/area-chart",
        destination: "/docs/area-chart/static",
        permanent: true,
      },
      {
        source: "/docs/bar-chart",
        destination: "/docs/bar-chart/static",
        permanent: true,
      },
      {
        source: "/docs/composed-chart",
        destination: "/docs/composed-chart/static",
        permanent: true,
      },
      {
        source: "/docs/line-chart",
        destination: "/docs/line-chart/static",
        permanent: true,
      },
      {
        source: "/docs/pie-chart",
        destination: "/docs/pie-chart/static",
        permanent: true,
      },
      {
        source: "/docs/radar-chart",
        destination: "/docs/radar-chart/static",
        permanent: true,
      },
      {
        source: "/docs/radial-chart",
        destination: "/docs/radial-chart/static",
        permanent: true,
      },
      {
        source: "/docs/scatter-chart",
        destination: "/docs/scatter-chart/static",
        permanent: true,
      },
      {
        source: "/docs/treemap-chart",
        destination: "/docs/treemap-chart/static",
        permanent: true,
      },
      {
        source: "/docs/funnel-chart",
        destination: "/docs/funnel-chart/static",
        permanent: true,
      },
      {
        source: "/docs/waterfall-chart",
        destination: "/docs/waterfall-chart/static",
        permanent: true,
      },
      // Some old projects redirects cached on google
      {
        source: "/docs/line-charts",
        destination: "/docs/line-chart/static",
        permanent: true,
      },
      {
        source: "/docs/area-charts",
        destination: "/docs/area-chart/static",
        permanent: true,
      },
      {
        source: "/docs/bar-charts",
        destination: "/docs/bar-chart/static",
        permanent: true,
      },
      {
        source: "/docs/pie-charts",
        destination: "/docs/pie-chart/static",
        permanent: true,
      },
      {
        source: "/docs/radar-charts",
        destination: "/docs/radar-chart/static",
        permanent: true,
      },
      {
        source: "/docs/radial-charts",
        destination: "/docs/radial-chart/static",
        permanent: true,
      },
      {
        source: "/docs/prerequisites",
        destination: "/docs/installation",
        permanent: true,
      },
      {
        source: "/.well-known/skills/index.json",
        destination: "/.well-known/agent-skills/index.json",
        permanent: true,
      },
      {
        source: "/.well-known/skills/nqchart/skill.md",
        destination: "/.well-known/agent-skills/nqchart/SKILL.md",
        permanent: true,
      },
    ];
  },
  rewrites() {
    return [
      {
        source: "/docs.md",
        destination: "/llm",
      },
      {
        source: "/docs/:slug.md",
        destination: "/llm/:slug",
      },
      {
        source: "/docs/:chart/:slug.md",
        destination: "/llm/:chart/:slug",
      },
      {
        source: "/docs/:chart/:slug/blocks.md",
        destination: "/llm/:chart/:slug/blocks",
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
