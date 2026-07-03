import Link from "next/link";

import { GithubIcon } from "@/assets/icons";
import { NQChartMark } from "@/assets/logos/nqchart";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "@/components/docs/sidebar/theme-switcher";
import { fetchGithubStars } from "@/lib/fetch-github-stars";

export async function LandingHeader() {
  const stars = await fetchGithubStars();

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="NQChart home">
          <NQChartMark
            width="22"
            height="22"
            className="text-foreground"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold">NQChart</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs">Docs</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="https://github.com/nqlib/nqchart" target="_blank" rel="noreferrer">
              <GithubIcon />
              {stars && <span className="text-xs tabular-nums">{stars}</span>}
            </Link>
          </Button>
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
