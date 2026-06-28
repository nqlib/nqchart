---
name: beecharts-fixed-agents
description: >-
  Agent routing for beecharts-fixed — search index.md before fixing bugs, flicker,
  or hover regressions in this repo. NOT for external app integration.
skill: beecharts-fixed
kind: agents
metadata:
  author: beecharts
  version: "1.0.0"
---

# BeeCharts fixed — Agent routing

**Audience:** Maintainers fixing bugs in the beecharts repo.

## When to use

- User asks to **fix**, **debug**, or **investigate** chart behavior (hover, flicker, wrong opacity, compile output, tooltip).
- You suspect a **regression** of something fixed before.
- Before writing a new `compile-*` or `use-bee-echarts` workaround.

## Read order

1. [SKILL.md](./SKILL.md) — workflow
2. **[index.md](./index.md)** — search domain + semantic tables
3. Linked `domains/*.md` then `fixes/*.md`

## Do not use for

- Integrating BeeCharts in an external app → [skills/consumer/beecharts/SKILL.md](../../../skills/consumer/beecharts/SKILL.md)
- New chart features or registry items → [beecharts-dev](../beecharts-dev/SKILL.md)
- Docs site / MDX only → [beecharts-docs](../beecharts-docs/SKILL.md)
