"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const STORAGE_KEY = "beecharts:package-manager";

const COMMANDS: Record<PackageManager, string> = {
  pnpm: "pnpm dlx shadcn@latest add @beecharts/bar-chart",
  npm: "npx shadcn@latest add @beecharts/bar-chart",
  yarn: "yarn dlx shadcn@latest add @beecharts/bar-chart",
  bun: "bunx --bun shadcn@latest add @beecharts/bar-chart",
};

function readStoredManager(): PackageManager {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as PackageManager | null;
    if (stored && stored in COMMANDS) return stored;
  } catch {
    // private browsing / disabled storage
  }
  return "pnpm";
}

export function InstallCommand({ className }: { className?: string }) {
  const [manager, setManager] = useState<PackageManager>(readStoredManager);
  const [copied, setCopied] = useState(false);

  function selectManager(next: PackageManager) {
    setManager(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  function copy() {
    void navigator.clipboard.writeText(COMMANDS[manager]).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <ToggleGroup
        type="single"
        value={manager}
        onValueChange={(value) => value && selectManager(value as PackageManager)}
        variant="outline"
        size="sm"
        aria-label="Package manager"
      >
        {(Object.keys(COMMANDS) as PackageManager[]).map((key) => (
          <ToggleGroupItem key={key} value={key} aria-label={key}>
            {key}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="bg-muted/40 flex items-center gap-3 rounded-md border px-3 py-2">
        <code className="text-muted-foreground flex-1 truncate font-mono text-xs sm:text-sm">
          <span className="text-foreground/40 select-none">$ </span>
          {COMMANDS[manager]}
        </code>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy install command"}
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
