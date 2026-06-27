import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { fetchGithubStars } from "@/lib/fetch-github-stars";
import { Button } from "@/components/ui/button";
import ThemeSwitcher from "./theme-switcher";
import { GithubIcon } from "@/assets/icons";
import Link from "next/link";

const DocsHeader = async () => {
  const stars = await fetchGithubStars();

  return (
    <SidebarHeader className="bg-background fixed top-0 z-50 flex h-14 w-full flex-row justify-between border-b p-0 sm:sticky sm:h-[35px] sm:border-b-0 sm:bg-transparent">
      <div className="pointer-events-auto flex items-center pl-3">
        <SidebarTrigger className="sidebar:hidden" />
      </div>
      <div className="pointer-events-auto relative z-10 flex h-full items-center gap-2 pl-6">
        {stars && (
          <>
            <Link href="https://github.com/ctesibius/beecharts" target="_blank">
              <Button variant="link" size="sm">
                <GithubIcon /> <span className="text-foreground text-xs">{stars}</span>
              </Button>
            </Link>
            <span className="text-muted">|</span>
          </>
        )}
        <ThemeSwitcher />
        <Button className="group pointer-events-none" size="sm" variant="ghost">
          <span className="text-muted-foreground text-xs">Built by Ctesibius</span>
        </Button>
      </div>
    </SidebarHeader>
  );
};

export default DocsHeader;
