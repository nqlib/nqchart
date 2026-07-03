---
name: nqchart-fixed-ref-frontmatter
description: >-
  Frontmatter schema and templates for every markdown file under nqchart-fixed.
  Read when adding a new domain or fix note to the fixed skill.
skill: nqchart-fixed
kind: reference
metadata:
  author: nqchart
  version: "1.0.0"
---

# Frontmatter (required on every file)

Every markdown file under `.agents/skills/fixed/` **must** start with YAML frontmatter containing at least `name` and `description`. `pnpm skill:validate` enforces this.

## Shared fields

| Field | Required | Notes |
|-------|----------|--------|
| `name` | yes | Unique slug, kebab-case, prefix `nqchart-fixed-` |
| `description` | yes | One paragraph: what this file is + when to read it |
| `skill` | yes | Always `nqchart-fixed` |
| `kind` | yes | `skill` \| `agents` \| `index` \| `domain` \| `fix` \| `reference` |
| `metadata.author` | yes | `nqchart` |
| `metadata.version` | yes | Semver string |

## Kind-specific fields

| `kind` | Extra fields |
|--------|----------------|
| `index` | — |
| `agents` | — |
| `domain` | `domain` (slug), `tags` (comma-friendly list) |
| `fix` | `domain`, `status` (`fixed`), `fixed` (YYYY-MM), `tags` |

## Templates

**index.md**

```yaml
---
name: nqchart-fixed-index
description: >-
  Domain and semantic search index for past NQChart fixes. Search here first when fixing regressions.
skill: nqchart-fixed
kind: index
metadata:
  author: nqchart
  version: "1.0.0"
---
```

**domains/&lt;slug&gt;.md**

```yaml
---
name: nqchart-fixed-domain-<slug>
description: >-
  <Domain> — symptoms and layers. Read before chart-specific fix notes in this domain.
skill: nqchart-fixed
kind: domain
domain: <slug>
tags: tag1, tag2, tag3
metadata:
  author: nqchart
  version: "1.0.0"
---
```

**fixes/&lt;domain&gt;-&lt;slug&gt;.md**

```yaml
---
name: nqchart-fixed-<domain>-<slug>
description: >-
  Fixed: <one-line summary>. Root cause, files, and verification for this incident.
skill: nqchart-fixed
kind: fix
domain: <domain>
status: fixed
fixed: YYYY-MM
tags: tag1, tag2
metadata:
  author: nqchart
  version: "1.0.0"
---
```

After adding frontmatter, update [index.md](../index.md) domain + semantic tables.
