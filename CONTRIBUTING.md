# Contributing to HeyTools

Thanks for helping improve HeyTools. This project is a **free online tools** platform: prefer shipping better tools and UX over SaaS features.

Please read [docs/architecture.md](./docs/architecture.md) before large changes.

## Project structure

| Path                   | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `src/routes`           | Thin SvelteKit pages and endpoints (HTTP only)  |
| `src/lib/engine`       | Plugin contracts, registry helpers, share-state |
| `src/lib/tools/<id>/`  | One folder per tool (`index.ts`, `ui.svelte`)   |
| `src/lib/seo`          | Metadata and JSON-LD builders                   |
| `src/lib/ui`           | Shared design-system components                 |
| `src/lib/features`     | Favorites / history (Supabase-backed)           |
| `src/lib/supabase`     | Auth clients                                    |
| `src/lib/server`       | Env validation, logging                         |
| `src/lib/utils`        | Pure helpers (encoding, color, PDF, files, …)   |
| `src/lib/config`       | Site name, categories, platform collections     |
| `tests/tools`          | Vitest tests per tool (and shared helpers)      |
| `tests/e2e`            | Playwright smoke tests                          |
| `scripts/new-tool.mjs` | Tool scaffold CLI                               |
| `docs/`                | Architecture and deeper design notes            |

**Path aliases:** `$lib`, `$engine`, `$tools`, `$seo`, `$ui`, `$server`.

**Layer rule:** tool plugins must not import Supabase or feature APIs. Routes stay thin; put logic in engine/utils/tools.

## Development setup

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://localhost:5173`. Supabase env vars are optional for browsing and running tools locally; they are required for auth, favorites, and history.

## Adding a new tool

Scaffold a plugin (registers the tool and creates a starter test):

```sh
pnpm new-tool --id my-tool --name "My Tool" --category text
# or
pnpm new-tool my-tool
```

Valid `--category` values:

`developer` · `text` · `data` · `image` · `pdf` · `color` · `encoders` · `converters` · `generators` · `calculators`

Then:

1. Implement `run` (and Valibot `inputSchema`) in `src/lib/tools/<id>/index.ts`
2. Build the UI in `ui.svelte` using `$ui` components
3. Fill SEO fields: `title`, `description`, `keywords`, **faq** (≥2–3), **howTo**, `related`, `workflow` when useful
4. Declare `capabilities`, `share.params`, and `presets` when applicable
   - Keep share params **compact** (flags, short numbers, small strings)
   - Do **not** live-sync large document bodies (Markdown drafts, big CSS dumps, etc.) into the URL—Share should copy a short tool link; presets can still apply via a one-shot query param that the UI immediately strips
5. Prefer ActionBar copy/share over duplicate inline copy buttons
6. Expand `tests/tools/<id>.test.ts` beyond the scaffold smoke assertion
7. Open `/tools/<id>` and verify SSR shell + client UI
8. Use semantic tokens (`bg-bg`, `text-fg`, `border-border`, …) so the tool works in light and dark themes

Image/PDF tools should stay **browser-local** unless there is a strong, documented reason otherwise.

## Coding conventions

- **TypeScript** + **Svelte 5** runes (`$state`, `$derived`, `$props`)
- Validate inputs with **Valibot**; keep `run` pure and testable when possible
- Use semantic design tokens / existing `$ui` primitives—avoid one-off layout systems and hardcoded `bg-white` / `text-gray-*` that break dark mode
- Match surrounding file style; no drive-by refactors unrelated to your change
- Prefer shared utils (`encoding`, `color`, `pdf`, share-state helpers) over copy-paste
- Do not add billing, public APIs, or user-owned collections without an explicit product decision
- Theme preference lives in `localStorage` via `src/lib/utils/theme.ts` (default light); do not reintroduce `prefers-color-scheme` as the default unless the product decides otherwise

## Testing requirements

Before opening a PR:

```sh
pnpm check
pnpm lint
pnpm test
```

Also run when UI routes change meaningfully:

```sh
pnpm test:e2e
```

Expectations:

- New tools include Vitest coverage for `run` / edge cases
- Registry-related changes should not break `tests/tools/registry.test.ts`
- Do not weaken SEO/a11y contracts on shared shell components without discussion

Format locally with `pnpm format` if Prettier fails `pnpm lint`.

## Pull request checklist

- [ ] Scope is focused; no unrelated refactors
- [ ] New/changed tools have metadata: faq, howTo, related (and share/presets if relevant)
- [ ] Tool does not import Supabase/features from the plugin folder
- [ ] `pnpm check`, `pnpm lint`, and `pnpm test` pass
- [ ] e2e updated or smoke still green if routes/navigation changed
- [ ] Docs updated when behavior or env contracts change (`README`, `CHANGELOG`, architecture)
- [ ] No secrets committed (`.env`, service role keys, etc.)

## Reporting bugs and security issues

- Bugs and features: open a GitHub issue with steps to reproduce
- Vulnerabilities: follow [SECURITY.md](./SECURITY.md)—do not file public issues for sensitive reports
