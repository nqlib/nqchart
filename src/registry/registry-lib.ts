import type { Registry } from "shadcn/schema";

export const lib: Registry["items"] = [
  {
    name: "chart-recipes",
    description:
      "Data helpers for histogram, Pareto, heatmap, bullet, gauge, and box plot shapes",
    type: "registry:lib",
    files: [
      {
        path: "lib/chart-recipes.ts",
        type: "registry:lib",
        target: "lib/chart-recipes.ts",
      },
    ],
  },
];
