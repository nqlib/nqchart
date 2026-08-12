# Docs conventions

## Docs-as-code

A PR that changes behavior updates, in the **same PR**:

1. The owning **story** status (and epic status if the epic closes), when product work.
2. The **`plans/NNN-*.md`** status when a feature blueprint lands.
3. **Architecture** notes when layer rules or the public surface move.
4. **Public MDX** / consumer skill when the user-facing API changes.

Do not leave the vault describing a world the code no longer implements.

## Wikilinks vs paths

Obsidian-style `[[wikilinks]]` are fine inside `docs/`. Prefer relative markdown links
when the reader may be on GitHub (`[architecture/system](architecture/system.md)`).

## Naming

| Kind | Pattern |
|------|---------|
| Epic folder | `product/epics/EP-NNN-kebab-name/` |
| Epic file | `epic.md` with YAML frontmatter |
| Story file | `stories/ST-NNN-kebab-name.md` |
| Plan | `plans/NNN-kebab-name.md` (zero-pad 3) |

IDs are **global and never reused**. Next free ids: see [`product/README.md`](product/README.md).

## Tone

Write like SecoLab's product docs: outcome-first, explicit **In / Out**, name the blocker
when there is one, and record *what the check already established* so the next pass does
not rediscover it.
