---
name: no-box-glow
description: >-
  Avoid decorative box-shadow / box blur / glow by default. Ask when glow or
  shadow design context is unclear. Prefer shape-aware SVG blur or drop-shadow
  when glow is approved. Use for docs chrome (TOC diamond), landing, and UI
  marks in nqchart — not for intentional ex-glowing-* chart recipes.
metadata:
  author: nqchart
  version: "1.0.0"
---

# No decorative box glow (ask when unclear)

Maintainer skill for **docs site chrome**, landing, and DOM UI marks in this repo.
Aligned with nqui’s `.cursor/rules/no-box-glow-ask-first.mdc`.

## Default

**Do not** add decorative `box-shadow`, soft box blurs, or glow effects for polish.
They usually look cheap (AABB “square” haze around rotated or irregular shapes).

Allowed without asking:

- Functional elevation already defined by the design system (popover/menu shadows).
- Focus rings / `ring-*` for accessibility.
- Borders and token-driven radius — not glow.
- **Chart series recipes** named `ex-glowing-*` (ECharts emphasis / series light) —
  those are intentional product demos, not DOM box glow. Do not “fix” them by
  removing series glow unless the user asks.

## When the user asks for glow, bloom, or soft light

1. **If context is unclear — ASK first** (do not invent):
   - What should glow (which shape / mark)?
   - Soft ambient vs sharp accent?
   - Must the glow follow the **shape outline** (diamond, path, icon) or is a rectangular chip OK?
2. **If glow is approved**, prefer **shape-aware** techniques:
   - SVG filter (`feGaussianBlur`) on the actual geometry, with an **expanded filter region** so blur is not cropped.
   - Or `filter: drop-shadow(...)` on the painted shape (follows alpha / transform).
   - Keep glow layers **outside** CSS `mask` / `overflow: hidden` that would crop the blur.
3. **Never** use `box-shadow` on a rotated or non-rectangular mark when the intent is a shape glow — it lights the bounding box and looks cropped or square.

## Docs TOC diamond (canonical example)

File: `src/components/docs/mdx/components/toc-indicator.tsx`  
Showcase port: `nqui-showcase` `docs-toc-indicator.tsx` (same rules).

| Do | Don’t |
|----|--------|
| Blur the diamond geometry via SVG `feGaussianBlur` | `box-shadow` / CSS filter on a `rotate-45` chip |
| Paint diamond **outside** the path fade `mask` | Nest glow under `maskImage` / masked trail |
| `overflow-visible` on the rail; scroll on the link list only | `overflow-y-auto` on a parent that clips the glow |

```tsx
// ❌ Box glow on a diamond / rotated chip
<div className="rotate-45 shadow-[0_0_10px_2px_…] bg-primary" />

// ❌ Glow inside a masked / overflow-clipped parent (blur gets cropped)
<div style={{ maskImage: "…" }}><div className="shadow-[…]" /></div>
```

```tsx
// ✅ Shape glow (SVG blur of the diamond), outside masks
<svg className="overflow-visible">
  <filter id="glow" x="-120%" y="-120%" width="340%" height="340%">
    <feGaussianBlur stdDeviation="2.4" />
  </filter>
  <rect transform="rotate(45 …)" filter="url(#glow)" opacity={0.55} />
  <rect transform="rotate(45 …)" />
</svg>
```

## Reminder

Unclear visual brief involving shadow, blur, glow, bloom, neon, or “make it shine” → **ask the user before implementing**. Default is no decorative glow.

## Related

- Docs site work: [nqchart-docs](../nqchart-docs/SKILL.md)
- Sibling rule (nqui): `../nqui/.cursor/rules/no-box-glow-ask-first.mdc`
