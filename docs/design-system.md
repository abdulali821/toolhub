# ToolHub Design System (Goforit visual language)

Visual system aligned to the Goforit mockups. Product name remains **ToolHub**. Tokens live in `src/routes/layout.css`.

## Color palette

| Token                                | Value                             | Role                      |
| ------------------------------------ | --------------------------------- | ------------------------- |
| `--color-bg`                         | `#fafafa`                         | Page background           |
| `--color-bg-elevated`                | `#ffffff`                         | Cards, header             |
| `--color-fg`                         | `#18181b`                         | Primary text / black CTAs |
| `--color-muted`                      | `#71717a`                         | Secondary text            |
| `--color-border`                     | `#e4e4e7`                         | Borders                   |
| `--color-accent`                     | `#18181b`                         | Primary actions           |
| `--color-accent-fg`                  | `#ffffff`                         | Text on accent            |
| `--color-accent-hover`               | `#27272a`                         | Hover                     |
| `--color-focus`                      | `#18181b`                         | Focus rings               |
| Semantic danger/success/warning/info | unchanged intent, gray-compatible | Alerts                    |

Category accents are muted zinc washes (see `category-meta.ts`).

## Typography

| Role                    | Font                                |
| ----------------------- | ----------------------------------- |
| Display / H1–H3 / brand | Playfair Display (`--font-display`) |
| Body / UI               | Inter Variable (`--font-sans`)      |

## Spacing & layout

4px base `--space-*`. Container: `--container-max: 80rem` (`max-w-7xl`).

## Radius

| Token         | Use                                           |
| ------------- | --------------------------------------------- |
| `--radius-md` | Buttons, inputs (`0.5rem`)                    |
| `--radius-lg` | Cards (`0.75rem`)                             |
| `--radius-xl` | Large cards / search (`1rem` / `rounded-2xl`) |

## Shadows

| Token                    | Value                               |
| ------------------------ | ----------------------------------- |
| `--shadow-premium`       | `0 4px 20px -2px rgba(0,0,0,0.05)`  |
| `--shadow-premium-hover` | `0 10px 30px -4px rgba(0,0,0,0.08)` |

## Buttons

- **Primary:** black fill, white text, `rounded-lg`
- **Secondary:** white + border
- **Ghost:** transparent, hover gray-50

## Cards

White, `rounded-2xl`, light border, soft premium shadow on hover; icon tile inverts to black on hover.

## Command palette

Dark surface `#1c1c1e`, light text, section labels uppercase muted.

## Motion

`--duration-fast` 150ms, `--duration-base` 220ms; respect `prefers-reduced-motion`.

## Icons

Inline SVG only (no Font Awesome CDN).
