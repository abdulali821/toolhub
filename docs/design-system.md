# ToolHub Design System

Living reference for visual consistency. Tokens live in `src/routes/layout.css`; components live under `src/lib/ui`.

**Principle:** refine, don’t reinvent. Prefer whitespace, hierarchy, and subtle motion over decoration.

## Color palette

### Core

| Token                  | Light     | Role                             |
| ---------------------- | --------- | -------------------------------- |
| `--color-bg`           | `#f4f7f8` | Page background                  |
| `--color-bg-elevated`  | `#ffffff` | Cards, header, elevated surfaces |
| `--color-fg`           | `#0f1c1f` | Primary text                     |
| `--color-muted`        | `#5b6b70` | Secondary text                   |
| `--color-border`       | `#d5dee1` | Dividers, control borders        |
| `--color-accent`       | `#0f766e` | Brand / primary actions          |
| `--color-accent-fg`    | `#ffffff` | Text on accent                   |
| `--color-accent-hover` | `#0d9488` | Accent hover                     |
| `--color-focus`        | `#0f766e` | Focus rings                      |

### Semantic

| Token                                    | Use                 |
| ---------------------------------------- | ------------------- |
| `--color-danger` / `--color-danger-bg`   | Errors, destructive |
| `--color-success` / `--color-success-bg` | Success feedback    |
| `--color-warning` / `--color-warning-bg` | Warnings            |
| `--color-info` / `--color-info-bg`       | Informational       |

Dark theme overrides exist under `.dark` (not the default shipping theme).

### Category accents

Subtle scanability only—never neon. Defined in `src/lib/ui/catalog/category-meta.ts` (`categoryAccent`). Used as a 2px edge stripe + muted badge wash on cards.

## Typography

| Role                    | Font                                     | Typical scale                                                                                     |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Display / brand / H1–H3 | `--font-display` (Fraunces Variable)     | H1 home ~`text-4xl`→`text-6xl`; tool H1 ~`text-3xl`→`text-5xl`; section H2 ~`text-2xl`→`text-3xl` |
| Body / UI               | `--font-sans` (Source Sans 3 Variable)   | Body `text-base` / `text-lg`; captions `text-sm` / `text-xs`                                      |
| Eyebrows                | Sans, semibold, wide tracking, uppercase | `text-sm` / `text-xs` + accent or muted                                                           |

Hierarchy rules:

1. One display headline per viewport section
2. Muted supporting copy under headlines
3. Prefer `text-balance` / `text-pretty` on long titles and blurbs

## Spacing scale

4px base (`--space-*`):

| Token        | Rem  | px  |
| ------------ | ---- | --- |
| `--space-1`  | 0.25 | 4   |
| `--space-2`  | 0.5  | 8   |
| `--space-3`  | 0.75 | 12  |
| `--space-4`  | 1    | 16  |
| `--space-5`  | 1.25 | 20  |
| `--space-6`  | 1.5  | 24  |
| `--space-8`  | 2    | 32  |
| `--space-10` | 2.5  | 40  |
| `--space-12` | 3    | 48  |
| `--space-16` | 4    | 64  |
| `--space-20` | 5    | 80  |
| `--space-24` | 6    | 96  |

Section rhythm: prefer `py-12` / `sm:py-16` on marketing and listing pages; tool content uses slightly tighter vertical gaps with `border-t` separators between FAQ / related blocks.

## Border radius

| Token           | Value   | Use                              |
| --------------- | ------- | -------------------------------- |
| `--radius-sm`   | 0.25rem | Chips, kbd                       |
| `--radius-md`   | 0.5rem  | Buttons, inputs, badges          |
| `--radius-lg`   | 0.75rem | Cards, tool shell, search panels |
| `--radius-full` | 9999px  | Trust pills, avatars             |

## Shadows

| Token           | Use                                     |
| --------------- | --------------------------------------- |
| `--shadow-sm`   | Default card / surface rest             |
| `--shadow-md`   | Hover lift on cards                     |
| `--shadow-lg`   | Rare elevated overlays                  |
| `--shadow-ring` | Soft accent focus wash on search inputs |

Hover pattern: `hover:-translate-y-0.5` + `hover:shadow-md` + subtle border accent. Keep motion short.

## Buttons

`Button` variants (`src/lib/ui/primitives/Button.svelte`):

| Variant     | When                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `primary`   | Main CTA (homepage Search, ActionBar **Copy**, download-only primary) |
| `secondary` | Secondary path (Browse, Download when Copy exists)                    |
| `ghost`     | Tertiary (Reset, Share, presets)                                      |
| `danger`    | Destructive                                                           |

Sizes: `sm` (toolbar), `md` (forms), `lg` (hero).

Press feedback: `active:scale-[0.98]` (disabled when `disabled`). Respect `prefers-reduced-motion` via global CSS.

## Cards

| Variant       | Pattern                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| Tool card     | Left accent stripe + category badge + title / clamp-2 description / uppercase category |
| Category card | Same language, larger badge + count                                                    |
| Pack card     | `.surface-card`, badge + truncated tool list + CTA                                     |
| Related card  | Light hover lift, no icons required                                                    |

Do **not** add large illustrations or bright fills.

## Inputs

- Height ~`h-11` on listing search bars
- Border `border-border`, fill `bg-bg`
- Focus: accent border + `--shadow-ring`
- Pair with `Field` for labels / hints / errors (`aria-describedby`)

## Icons

- Stroke icons, ~1.75 weight, currentColor
- Badge sizes: sm 32px box, md 36px, lg 44px (`CategoryBadge`)
- Category glyph map: `categoryIconKind` in `category-meta.ts`

## Motion

| Token             | Value                           |
| ----------------- | ------------------------------- |
| `--duration-fast` | 150ms                           |
| `--duration-base` | 220ms                           |
| `--duration-slow` | 400ms                           |
| `--ease-out`      | `cubic-bezier(0.16, 1, 0.3, 1)` |

Utilities: `.animate-rise`, `.animate-fade`, `.animate-pulse-soft`, `.pressable`.

`prefers-reduced-motion: reduce` collapses animation/transition durations globally.

## Responsive breakpoints

Follow Tailwind defaults:

| Prefix | Min width |
| ------ | --------- |
| `sm`   | 640px     |
| `md`   | 768px     |
| `lg`   | 1024px    |
| `xl`   | 1280px    |

Container max: `--container-max` = `72rem`.

## Accessibility

- Visible `:focus-visible` rings using `--color-focus`
- Do not lower muted text below readable contrast on `--color-bg`
- Prefer labels / `aria-label` on icon-only and file controls
- Loading states expose `aria-busy` / `aria-live`

## Adding UI

1. Reuse `$ui` primitives before inventing new ones
2. Match spacing and radius tokens above
3. Prefer category accents from `category-meta`, not ad-hoc hex in pages
4. Document net-new tokens here and in `layout.css`
