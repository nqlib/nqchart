import Link from "next/link";

import { BeeChartMark } from "@/assets/logos/beechart";
import { GithubIcon } from "@/assets/icons";
import { SITE_AUTHOR } from "@/globals/constants/site";

const LINKS: { label: string; href: string }[] = [
  { label: "Docs", href: "/docs" },
  { label: "Installation", href: "/docs/installation" },
  { label: "Chart config", href: "/docs/chart-config" },
  { label: "Recipes", href: "/docs/chart-recipes" },
];

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BeeChartMark width="20" height="20" className="text-foreground" />
          <span className="text-sm font-semibold">BeeCharts</span>
          <span className="text-muted-foreground text-xs">MIT licensed</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="https://github.com/ctesibius/beecharts"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
          >
            <GithubIcon />
            GitHub
          </Link>
        </nav>
      </div>
      <div className="border-t">
        <div className="text-muted-foreground mx-auto w-full max-w-6xl px-6 py-4 text-xs">
          Built by {SITE_AUTHOR} · Powered by Apache ECharts
        </div>
      </div>
    </footer>
  );
}
