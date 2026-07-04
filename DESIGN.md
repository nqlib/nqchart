---
name: NQChart
description: Composable React charts — warm-paper docs UI with restrained violet primary
colors:
  primary: "oklch(0.55 0.23 275)"
  primary-foreground: "oklch(0.98 0 0)"
  background: "oklch(0.982 0.0054 95)"
  foreground: "oklch(0.2416 0.0219 57)"
  card: "oklch(0.993 0.003 95)"
  muted-foreground: "oklch(0.5576 0.0222 57.81)"
  border: "oklch(0.892 0.006 95)"
  chart-1: "oklch(0.55 0.23 275)"
  chart-2: "oklch(0.6 0.118 184.704)"
  destructive: "oklch(0.6 0.15 25)"
  logo-gold: "oklch(0.8 0.16 85)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  sm: "calc(0.45rem - 4px)"
  md: "calc(0.45rem - 2px)"
  lg: "0.45rem"
  xl: "calc(0.45rem + 4px)"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
---

# Design System: NQChart

## 1. Overview

**Creative North Star: "The Instrument Panel"**

NQChart's visual system is a **technical field guide** dressed as a product UI. Surfaces are warm but neutral — paper-toned backgrounds with a single violet primary for actions and chart series slot 1. Density is comfortable for docs and dashboard demos; nothing shouts for attention except the charts themselves.

The system explicitly rejects generic AI SaaS aesthetics (gradient hero text, glassmorphism, side-stripe callouts, cream editorial backgrounds). It inherits **nqui** warm-paper neutrals and pairs them with a hue-275 primary that reads as confident engineering blue-violet, not startup purple gradient.

Dark mode uses **neutral charcoal surfaces** (not glowing-on-black). Charts keep semantic slot colors; UI chrome stays flat and legible.

**Key Characteristics:**

- OKLCH tokens throughout (`globals.css` `:root` / `.dark`)
- Restrained accent: primary on buttons, links, and `--chart-1` only
- Geist sans for UI; JetBrains Mono for code
- shadcn/Radix component vocabulary (Button, Card, docs sidebar)
- Flat elevation by default; `shadow-sm` on cards only
- Chart previews are the visual hero — docs chrome stays quiet

## 2. Colors

Warm-paper neutrals with a single violet primary and five chart slots mapped to CSS variables.

### Primary

- **Signal Violet** (oklch(0.55 0.23 275)): Primary buttons, links, focus rings, sidebar active states, and `--chart-1`. The main accent — rare on any single screen.

### Secondary

- **Paper Wash** (oklch(0.95 0.006 95)): Secondary buttons and subtle fills — never competes with primary.

### Neutral

- **Warm Paper** (oklch(0.982 0.0054 95)): Page background in light mode; tinted toward hue 95, not cream-beige AI default.
- **Warm Ink** (oklch(0.2416 0.0219 57)): Body text and headings.
- **Muted Label** (oklch(0.5576 0.0222 57.81)): Secondary text, axis labels in chrome resolution — must stay ≥4.5:1 on paper backgrounds.
- **Hairline Border** (oklch(0.892 0.006 95)): Cards, inputs, dividers.
- **Charcoal Field** (oklch(0.16 0 0)): Dark mode background — neutral, not blue-black glow.

### Chart palette (data visualization)

- **chart-1** through **chart-5**: Semantic series slots in `globals.css`; consumers map `ChartConfig` keys to `var(--chart-N)`. Do not invent one-off hex colors in examples.

### Brand accent

- **Hive Gold** (oklch(0.8 0.16 85)): Logo mark abdomen only (`--logo-gold`); not a UI accent.

### Named Rules

**The One Voice Rule.** Primary violet appears on ≤10% of any docs screen — CTAs, active nav, one chart series emphasis. Its rarity is the point.

**The Paper Not Cream Rule.** Backgrounds stay high-lightness with minimal chroma (≈0.005–0.007). Warmth comes from hue 95 tint, not saturated sand/cream body fills.

## 3. Typography

**Display Font:** Geist (`--font-geist-sans`) with system-ui fallback  
**Body Font:** Geist (same stack — product register: one family is often right)  
**Label/Mono Font:** JetBrains Mono (`--font-jetbrains-mono`) for code and tabular GitHub stars

**Character:** Neutral geometric sans — technical, legible at small sizes in docs sidebars and preview toolbars. Inter is loaded but Geist is the default sans.

### Hierarchy

- **Display** (600, ~1.875rem / 30px, line-height 1.2): Page titles, major doc headings. Fixed rem scale — no fluid clamp in app UI.
- **Headline** (600, 1.125rem / 18px, line-height 1.3): Section titles, card titles (`font-semibold`).
- **Title** (500, 0.875rem / 14px, line-height 1.4): Button labels, nav items, preview tab labels.
- **Body** (400, 0.875rem / 14px, line-height 1.5): Prose and UI copy; cap prose at **65–75ch** in long MDX passages.
- **Label** (500, 0.8125rem / 13px): Compact controls (`Button size="sm"`), metadata, chart legend helper text.
- **Mono** (400, 0.8125rem, line-height 1.6): Code blocks (Shiki/Vesper tokens), CLI snippets.

### Named Rules

**The Code Is Data Rule.** Monospace is for code, config keys, and numeric tabular data — never for marketing headings or button labels.

## 4. Elevation

This system is **flat-by-default**. Depth comes from tonal layering (background → card → popover) and 1px borders, not dramatic shadows.

Cards use **`shadow-sm`** only — a subtle lift for doc preview panels. Inline dashboard tiles prefer **border-only** (`.nqui-card`: 1px `var(--border)`, no shadow). Buttons may use `.nqui-button-shadow` (inset highlight + 1px drop) for primary CTAs when enhanced styling is applied.

Dark mode borders use `color-mix` at 50% opacity on cards to avoid harsh lines.

### Shadow Vocabulary

- **Button surface** (`0 1px 0 inset rgba(255,255,255,0.15), 0 1px 1px rgba(0,0,0,0.075)`): Optional primary button polish via `--button-shadow`.
- **Card lift** (Tailwind `shadow-sm`): Doc preview containers and default `Card` component.

### Named Rules

**The Flat-By-Default Rule.** Surfaces rest flat. Shadow appears only on cards/previews or button hover feedback — never stacked card-in-card elevation.

## 5. Components

### Buttons

- **Shape:** Gently rounded (0.45rem base / `rounded-md` on sm sizes)
- **Primary:** `bg-primary text-primary-foreground`, h-8 default, hover `primary/90`
- **Ghost:** Header nav pattern — transparent, hover `accent` fill; no border
- **Outline / Secondary:** Standard shadcn variants for docs actions
- **Focus:** `ring-ring/50` 3px ring + border shift — always visible for keyboard users

### Cards / Containers

- **Corner Style:** `rounded-xl` (calc radius + 4px)
- **Background:** `bg-card` on `border` hairline
- **Shadow Strategy:** `shadow-sm` on default Card; `.nqui-card` border-only variant for inline demos
- **Internal Padding:** `py-6 px-6` with `gap-6` between header/content

### Navigation

- **Landing header:** Sticky, `bg-background/80 backdrop-blur`, h-14, max-w-6xl — ghost buttons + theme switcher
- **Docs sidebar:** Fumadocs + shadcn sidebar tokens (`--sidebar-*`); active item uses primary tint
- **Mobile:** Collapsible sidebar at `--breakpoint-sidebar: 940px`

### Chart preview panels

- **Character:** The chart is the content; chrome is minimal (reload, Code/Preview tabs)
- **Background:** Inherits card/surface tokens; chart canvas uses theme-aware `ChartConfig` → CSS vars
- **Padding:** `p-4` on example roots (`className="h-full w-full p-4"`)

### Code blocks

- Shiki themes with Vesper token colors (`--color-vesper-type`, `--color-vesper-string`)
- `--code` / `--code-highlight` surfaces distinct from page background

## 6. Do's and Don'ts

Concrete guardrails aligned with PRODUCT.md anti-references.

### Do:

- **Do** use OKLCH CSS variables from `globals.css` for all new UI surfaces.
- **Do** map chart colors through `ChartConfig` → `var(--chart-N)` so light/dark stay synchronized.
- **Do** keep docs chrome quieter than the charts in preview panels.
- **Do** use ghost buttons for secondary header actions; reserve primary for main CTAs.
- **Do** verify muted text contrast on tinted backgrounds before shipping docs changes.

### Don't:

- **Don't** use gradient text, purple-to-blue hero gradients, or neon accents on dark mode — generic AI SaaS tells.
- **Don't** use border-left or border-right greater than 1px as colored accent stripes on cards, alerts, or callouts.
- **Don't** nest cards inside cards in docs layouts — flatten hierarchy.
- **Don't** use cream/sand body backgrounds with high warmth chroma — stay on warm-paper neutrals.
- **Don't** put display-sized typography or monospace on navigation labels and buttons.
- **Don't** ship modals when inline expansion or docs sections would teach the same thing.
