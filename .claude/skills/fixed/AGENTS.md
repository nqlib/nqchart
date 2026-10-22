---
name: nqchart-fixed-agents
description: >-
  Agent routing for nqchart-fixed — search index.md before fixing bugs, flicker,
  or hover regressions in this repo. NOT for external app integration.
skill: nqchart-fixed
kind: agents
metadata:
  author: nqchart
  version: "1.0.0"
---

# NQChart fixed — Agent routing

**Audience:** Maintainers fixing bugs in the nqchart repo.

## When to use

- User asks to **fix**, **debug**, or **investigate** chart behavior (hover, flicker, wrong opacity, compile output, tooltip).
- You suspect a **regression** of something fixed before.
- Before writing a new `compile-*` or `use-nq-echarts` workaround.

## Read order

1. [SKILL.md](./SKILL.md) — workflow
2. **[index.md](./index.md)** — search domain + semantic tables
3. Linked `domains/*.md` then `fixes/*.md`

## Do not use for

- Integrating NQChart in an external app → [skills/consumer/nqchart/SKILL.md](../../../skills/consumer/nqchart/SKILL.md)
- New chart features or registry items → [nqchart-dev](../nqchart-dev/SKILL.md)
- Docs site / MDX only → [nqchart-docs](../nqchart-docs/SKILL.md)
