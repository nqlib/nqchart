"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { BunIcon, NpmIcon, PnpmIcon, YarnIcon } from "@/assets/icons";
import { useConfig } from "@/hooks/use-config";
import CopyButton from "./copy-button";
import { cn } from "@/lib/utils";

type PackageManager = "npm" | "yarn" | "bun" | "pnpm";

interface CliBlockProps {
  commands: string[];
  /** `add` (default) installs registry items; `init` bootstraps shadcn/ui in a new project. */
  action?: "add" | "init";
}

const packageAddCommands: Record<PackageManager, string> = {
  npm: "npx shadcn@latest add",
  yarn: "yarn shadcn@latest add",
  bun: "bunx --bun shadcn@latest add",
  pnpm: "pnpm dlx shadcn@latest add",
};

const packageInitCommands: Record<PackageManager, string> = {
  npm: "npx shadcn@latest init",
  yarn: "yarn dlx shadcn@latest init",
  bun: "bunx --bun shadcn@latest init",
  pnpm: "pnpm dlx shadcn@latest init",
};

function CliBlock({ commands, action = "add" }: CliBlockProps) {
  const { packageManager, setConfig } = useConfig();
  const packageCommands = action === "init" ? packageInitCommands : packageAddCommands;
  const command =
    action === "init" ? packageCommands[packageManager] : `${packageCommands[packageManager]} ${commands.join(" ")}`;

  return (
    <Tabs
      defaultValue="pnpm"
      value={packageManager}
      onValueChange={(value) => setConfig({ packageManager: value as PackageManager })}
    >
      <div className="bg-muted group mt-2 flex flex-col rounded-[8px] p-1">
        <div className="flex flex-row items-center justify-between pr-1 pl-2">
          <TabsList
            variant="underline"
            indicatorClassName={cn(
              packageManager === "npm" && "bg-[#C3292F]!",
              packageManager === "yarn" && "bg-[#3592BD]!",
              packageManager === "bun" && "bg-primary!",
              packageManager === "pnpm" && "bg-[#FAAF18]!",
            )}
          >
            <TabsTab
              className="min-h-9 gap-2 px-2 hover:bg-transparent! data-active:text-[#C3292F]"
              value="npm"
            >
              <NpmIcon className="size-3" />
              npm
            </TabsTab>
            <TabsTab
              className="min-h-9 gap-2 px-2 hover:bg-transparent! data-active:text-[#3592BD]"
              value="yarn"
            >
              <YarnIcon className="size-3" />
              yarn
            </TabsTab>
            <TabsTab
              className="data-active:text-primary min-h-9 gap-2 px-2 hover:bg-transparent!"
              value="bun"
            >
              <BunIcon className="size-3" />
              bun
            </TabsTab>
            <TabsTab
              className="min-h-9 gap-2 px-2 hover:bg-transparent! data-active:text-[#FAAF18]"
              value="pnpm"
            >
              <PnpmIcon className="size-3" />
              pnpm
            </TabsTab>
          </TabsList>
          <CopyButton className="-mt-1" code={command} />
        </div>
        <div className="bg-background text-muted-foreground rounded-[5px] border p-3 text-[13px]">
          {Object.keys(packageCommands).map((manager) => (
            <TabsPanel className="font-mono" key={manager} value={manager}>
              {action === "init"
                ? packageInitCommands[packageManager]
                : `${packageAddCommands[packageManager]} ${commands.join(" ")}`}
            </TabsPanel>
          ))}
        </div>
      </div>
    </Tabs>
  );
}

export { CliBlock };
