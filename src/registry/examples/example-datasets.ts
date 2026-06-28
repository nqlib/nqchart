import { type ChartConfig } from "@/registry/ui/chart";
import type { TreemapNode } from "@/registry/echarts-core/parts/types";
import { chartConfigColor, chartConfigGradient } from "./chart-tokens";
import { DUAL_SERIES_CHART_CONFIG, TRAFFIC_MONTHLY_DATA } from "./example-shared";

export { TRAFFIC_MONTHLY_DATA, DUAL_SERIES_CHART_CONFIG };

export const SCATTER_DESKTOP = [
  { x: 120, y: 260 },
  { x: 180, y: 420 },
  { x: 240, y: 310 },
  { x: 320, y: 480 },
  { x: 390, y: 360 },
  { x: 450, y: 520 },
  { x: 510, y: 410 },
  { x: 580, y: 550 },
];

export const SCATTER_MOBILE = [
  { x: 140, y: 180 },
  { x: 210, y: 290 },
  { x: 280, y: 220 },
  { x: 350, y: 340 },
  { x: 420, y: 270 },
  { x: 490, y: 380 },
  { x: 560, y: 300 },
  { x: 620, y: 430 },
];

export const RADAR_SKILLS_DATA = [
  { skill: "JavaScript", desktop: 186, mobile: 80 },
  { skill: "TypeScript", desktop: 305, mobile: 200 },
  { skill: "React", desktop: 237, mobile: 120 },
  { skill: "Node.js", desktop: 173, mobile: 190 },
  { skill: "CSS", desktop: 209, mobile: 130 },
  { skill: "Python", desktop: 214, mobile: 140 },
];

export const FUNNEL_DATA = [
  { stage: "visitors", value: 10000 },
  { stage: "signups", value: 5200 },
  { stage: "trials", value: 2800 },
  { stage: "paid", value: 1200 },
];

export const FUNNEL_CONFIG = {
  visitors: { label: "Visitors", colors: chartConfigColor(0) },
  signups: { label: "Signups", colors: chartConfigColor(1) },
  trials: { label: "Trials", colors: chartConfigColor(3) },
  paid: { label: "Paid", colors: chartConfigColor(4) },
} satisfies ChartConfig;

export const WATERFALL_DATA = [
  { name: "opening", value: 120, type: "start" },
  { name: "product-a", value: 45, type: "increase" },
  { name: "returns", value: -15, type: "decrease" },
  { name: "marketing", value: 20, type: "increase" },
  { name: "closing", value: 170, type: "total" },
];

export const WATERFALL_CONFIG = {
  opening: { label: "Opening", colors: chartConfigColor(2) },
  "product-a": { label: "Product A", colors: chartConfigColor(1) },
  returns: { label: "Returns", colors: chartConfigColor(4) },
  marketing: { label: "Marketing", colors: chartConfigColor(0) },
  closing: { label: "Closing", colors: chartConfigColor(0) },
} satisfies ChartConfig;

export const TREEMAP_DATA: TreemapNode[] = [
  {
    name: "Engineering",
    children: [
      { name: "Frontend", value: 420 },
      { name: "Backend", value: 380 },
      { name: "Infra", value: 220 },
    ],
  },
  {
    name: "Growth",
    children: [
      { name: "Marketing", value: 310 },
      { name: "Sales", value: 290 },
    ],
  },
];

export const TREEMAP_CONFIG = {
  Engineering: { label: "Engineering", colors: chartConfigColor(0) },
  Frontend: { label: "Frontend", colors: chartConfigColor(1) },
  Backend: { label: "Backend", colors: chartConfigColor(0) },
  Infra: { label: "Infra", colors: chartConfigColor(3) },
  Growth: { label: "Growth", colors: chartConfigColor(4) },
  Marketing: { label: "Marketing", colors: chartConfigColor(2) },
  Sales: { label: "Sales", colors: chartConfigColor(1) },
} satisfies ChartConfig;

export const SPARKLINE_DATA = [
  { value: 12 },
  { value: 18 },
  { value: 14 },
  { value: 22 },
  { value: 19 },
  { value: 28 },
  { value: 24 },
  { value: 32 },
  { value: 29 },
  { value: 36 },
];

export const SPARKLINE_CONFIG = {
  trend: { label: "Sessions", colors: chartConfigColor(1) },
} satisfies ChartConfig;

export const BROWSER_DATA = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

export const BROWSER_GRADIENT_CONFIG = {
  chrome: { label: "Chrome", colors: chartConfigGradient(0, 2) },
  safari: { label: "Safari", colors: chartConfigGradient(1, 2) },
  firefox: { label: "Firefox", colors: chartConfigGradient(3, 4) },
  edge: { label: "Edge", colors: chartConfigGradient(0, 0) },
  other: { label: "Other", colors: chartConfigGradient(2, 2) },
} satisfies ChartConfig;

export const BROWSER_CONFIG = {
  chrome: { label: "Chrome", colors: chartConfigColor(0) },
  safari: { label: "Safari", colors: chartConfigColor(1) },
  firefox: { label: "Firefox", colors: chartConfigColor(3) },
  edge: { label: "Edge", colors: chartConfigColor(0) },
  other: { label: "Other", colors: chartConfigColor(2) },
} satisfies ChartConfig;

export const CHART_CONFIG_WITH_ICONS = {
  desktop: {
    label: "Desktop",
    colors: chartConfigColor(1),
  },
  mobile: {
    label: "Mobile",
    colors: chartConfigColor(4),
  },
} satisfies ChartConfig;
