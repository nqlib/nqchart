import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildAgentSkillsIndex } from "@/lib/agent-skills-index";
import { absoluteUrl } from "@/lib/utils";
import { source } from "@/lib/source";
import { processMdxForLLMs } from "@/lib/llm";

const CONSUMER_SKILL_DIR = join(process.cwd(), "skills/consumer/nqchart");
const AGENT_SKILLS_INDEX_PATH = join(
  process.cwd(),
  "public/.well-known/agent-skills/index.json",
);

const IMPORTANT_DOCS = new Set([
  "/docs",
  "/docs/installation",
  "/docs/components",
  "/docs/chart-config",
  "/docs/changelog",
]);

const CHART_DOCS = new Set([
  "/docs/area-chart/static",
  "/docs/line-chart/static",
  "/docs/bar-chart/static",
  "/docs/bar-chart/blocks",
  "/docs/composed-chart/static",
  "/docs/radar-chart/static",
  "/docs/pie-chart/static",
  "/docs/heatmap-chart/static",
  "/docs/calendar-chart/static",
  "/docs/radial-chart/static",
  "/docs/scatter-chart/static",
  "/docs/treemap-chart/static",
  "/docs/funnel-chart/static",
  "/docs/waterfall-chart/static",
  "/docs/sparkline-chart/static",
  "/docs/chart-recipes",
]);

function getMarkdownUrl(pageUrl: string) {
  return pageUrl === "/docs" ? "/docs.md" : `${pageUrl}.md`;
}

function getPageSummary(page: ReturnType<typeof source.getPages>[number]) {
  return {
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    markdownUrl: getMarkdownUrl(page.url),
  };
}

function renderLinks(pages: ReturnType<typeof source.getPages>) {
  return pages
    .map((page) => {
      const summary = getPageSummary(page);
      const description = summary.description ? ` - ${summary.description}` : "";
      return `- [${summary.title}](${summary.markdownUrl})${description}`;
    })
    .join("\n");
}

export function getAgentDocPages() {
  return source.getPages();
}

export function generateLlmsTxt() {
  const pages = getAgentDocPages();
  const startHere = pages.filter((page) => IMPORTANT_DOCS.has(page.url));
  const chartDocs = pages.filter((page) => CHART_DOCS.has(page.url));
  const uiDocs = pages.filter((page) => page.url.startsWith("/docs/ui/"));

  return `# NQChart Documentation

> NQChart is an open-source composable chart library for React dashboards, built with shadcn/ui and Apache ECharts.

## Start Here
${renderLinks(startHere)}

## Chart Components
${renderLinks(chartDocs)}

## UI Components
${renderLinks(uiDocs)}

## Agent Resources
- [Full documentation snapshot](/llms-full.txt)
- [Agent skill](/skill.md)
- [MCP server](/mcp)
`;
}

export async function generateLlmsFullTxt() {
  const pages = getAgentDocPages();
  const sections = await Promise.all(
    pages.map(async (page) => {
      const raw = await page.data.getText("raw");
      const content = processMdxForLLMs(raw).trim();
      const summary = getPageSummary(page);
      const description = summary.description ? `\n\n> ${summary.description}` : "";

      return `## ${summary.title}${description}

Source: ${absoluteUrl(summary.url)}
Markdown: ${absoluteUrl(summary.markdownUrl)}

${content}`;
    }),
  );

  return `# NQChart Full Documentation

> Full markdown snapshot of the NQChart documentation generated from the same MDX source as nqchart.local.

${sections.join("\n\n---\n\n")}
`;
}

export function readConsumerSkillFile(relativePath: string) {
  return readFileSync(join(CONSUMER_SKILL_DIR, relativePath), "utf8");
}

export function generateSkillMd() {
  return readConsumerSkillFile("SKILL.md");
}

export function getAgentSkillsIndex() {
  try {
    return JSON.parse(readFileSync(AGENT_SKILLS_INDEX_PATH, "utf8"));
  } catch {
    return buildAgentSkillsIndex();
  }
}
