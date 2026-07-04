# Product

## Register

product

## Users

- **App developers** integrating `@nqlib/nqchart` into React dashboards, internal tools, and SaaS products
- **Agent-assisted workflows** — coding agents reading docs, registry examples, and agent skills to compose charts correctly
- **Maintainers** of the docs site and chart registry who need predictable patterns across chart families

Context: users are in a **technical task** — pick a chart, copy a working example, tune `ChartConfig`, ship. They expect shadcn-level familiarity (compound components, theme tokens) with ECharts power underneath.

## Product Purpose

NQChart is a composable React chart library and documentation site. It exists to make **dashboard-grade charts** installable and theme-aware without a giant options object. Success looks like: developers copy one example, it matches their app's light/dark theme, and agents can discover the right chart + recipe from docs/skills.

The public site (`/`, `/docs/*`) is a **product surface**: docs, live previews, installation, and a demo dashboard — not a standalone marketing campaign.

## Brand Personality

**Expert · Clear · Composed**

- Speaks like a senior engineer who respects your time
- Shows working charts before explaining theory
- Calm, dense, trustworthy — the tool should disappear into the task

## Anti-references

- Generic AI SaaS landing pages (hero metric grids, purple gradient text, glass cards, neon dark mode)
- Recharts-style toy demos with no BI depth
- Over-decorated chart chrome that fights the data
- Side-stripe accent borders on cards and callouts
- Cream/sand "warm editorial" body backgrounds that read as 2026 AI default
- Display typography in UI labels, buttons, or dense docs navigation

## Design Principles

1. **Show, don't tell** — live chart previews and copy-paste examples over abstract API walls
2. **Practice what you preach** — the docs site uses the same tokens and components consumers get
3. **Theme-aware by default** — `ChartConfig` maps to CSS variables; light and dark are first-class
4. **Compound, not boolean** — chart roots + child parts, not mega-props
5. **Earned familiarity** — shadcn/Radix patterns users already trust; surprise only where charts need it

## Accessibility & Inclusion

- Target **WCAG 2.2 AA** for docs UI (contrast, keyboard nav, focus rings)
- Charts: tooltips and legends should remain readable; prefer theme tokens with verified contrast
- Respect **`prefers-reduced-motion`** for site animations; chart intro animations should not block reading data
- Code blocks and docs navigation must be fully keyboard-operable
