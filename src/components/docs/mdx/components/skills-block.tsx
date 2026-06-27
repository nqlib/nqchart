"use client";

import CopyButton from "./copy-button";

interface SkillsBlockProps {
  /** Arguments after `npx skills add` (repo + flags). */
  commands: string[];
}

function SkillsBlock({ commands }: SkillsBlockProps) {
  const command = `npx skills add ${commands.join(" ")}`;

  return (
    <div className="bg-muted group mt-2 flex flex-col rounded-[8px] p-1">
      <div className="flex flex-row items-center justify-between pr-1 pl-2">
        <span className="text-muted-foreground py-2 text-xs font-medium">Agent skills CLI</span>
        <CopyButton className="-mt-1" code={command} />
      </div>
      <div className="bg-background text-muted-foreground rounded-[5px] border p-3 font-mono text-[13px]">
        {command}
      </div>
    </div>
  );
}

export { SkillsBlock };
