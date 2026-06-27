import type { Registry } from "shadcn/schema";

import { examples } from "@/registry/registry-example";
import { charts } from "@/registry/registry-chart";
import { ui } from "@/registry/registry-ui";
import { blocks } from "@/registry/registry-blocks";
import { lib } from "@/registry/registry-lib";

export const registry = {
  homepage: "https://beecharts.vercel.app",
  name: "BeeCharts",
  items: [...ui, ...charts, ...lib, ...examples, ...blocks],
} satisfies Registry;
