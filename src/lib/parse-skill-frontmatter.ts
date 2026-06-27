/** Parse `description` from Agent Skill SKILL.md YAML frontmatter. */
export function parseSkillDescription(
  skillMd: string,
  fallback: string,
): string {
  const descMatch = skillMd.match(
    /^description:\s*>-\s*\n((?:  .+\n)+)|^description:\s*(.+)$/m,
  );
  if (!descMatch) return fallback;
  return descMatch[1]
    ? descMatch[1].replace(/^  /gm, "").replace(/\n/g, " ").trim()
    : (descMatch[2]?.trim() ?? fallback);
}
