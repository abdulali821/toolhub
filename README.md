# HeyTools 

Free, SEO-first **online tools** platform. Not a SaaS.

Format, convert, generate, and transform text, data, images, and PDFs—mostly **in your browser**, with optional sign-in for favorites and history.

**v1.0.0** ships **76 tools**, a plugin architecture, image & PDF toolkits, SEO categories, and an accessibility-minded shared shell.

| Doc                                              | Purpose                                   |
| ------------------------------------------------ | ----------------------------------------- |
| [RELEASE_NOTES.md](./RELEASE_NOTES.md)           | v1.0.0 highlights                         |
| [CHANGELOG.md](./CHANGELOG.md)                   | Keep a Changelog history                  |
| [CONTRIBUTING.md](./CONTRIBUTING.md)             | How to contribute and add tools           |
| [SECURITY.md](./SECURITY.md)                     | Vulnerability reporting                   |
| [docs/architecture.md](./docs/architecture.md)   | Layers, UX capabilities, constraints      |
| [docs/design-system.md](./docs/design-system.md) | Colors, type, spacing, components, motion |

## Requirements

- **Node.js** 22+ (LTS recommended)
- **pnpm** 9+ (or compatible)

## Quick start

```sh
pnpm install
cp .env.example .env
pnpm dev
```

App: [http://localhost:5173](http://localhost:5173)

For local tool browsing you can leave Supabase unset. Set `PUBLIC_SITE_URL` to match the origin you care about when testing canonicals, Open Graph, sitemap, or robots.

## Environment variables

Copy `.env.example` → `.env`. Never commit real secrets. Only `PUBLIC_*` values are exposed to the client.

| Variable                    | Required            | Description                                                                                                                                    |
| --------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`           | **Production yes**  | Absolute site origin, **no trailing slash** (e.g. `https://heytools.app`). Drives canonicals, OG URLs, sitemap `<loc>`, and robots `Sitemap:`. |
| `PUBLIC_SUPABASE_URL`       | For auth            | Supabase project URL                                                                                                                           |
| `PUBLIC_SUPABASE_ANON_KEY`  | For auth            | Supabase anon / publishable key                                                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only if used | **Never** expose to the browser; keep commented/local only                                                                                     |
| `LOG_LEVEL`                 | No                  | `debug` \| `info` \| `warn` \| `error` (default `info`)                                                                                        |
| `PUBLIC_FF_AUTH`            | No                  | Feature flag for auth UI (`true` / `false`)                                                                                                    |
| `PUBLIC_ADS_ENABLED`        | No                  | Shows ad placeholder slots when `true`                                                                                                         |

## Development workflow

```sh
pnpm dev          # Vite + SvelteKit dev server
pnpm check        # svelte-check / types
pnpm lint         # Prettier check + ESLint
pnpm format       # Prettier write
pnpm test         # Vitest (unit)
pnpm test:e2e     # Playwright smoke
pnpm build        # Production build → build/
pnpm preview      # Preview the production build
pnpm new-tool …   # Scaffold a tool plugin (see CONTRIBUTING.md)
```

**Quality gate before merge / release:**

```sh
pnpm check && pnpm lint && pnpm test && pnpm build
```

## Architecture overview

HeyTools keeps layers strict so tools stay easy to add:

```text
routes (thin) → engine (registry / contracts) → tools (plugins)
                    ↘ seo / ui / utils
features + supabase → favorites & history only (optional)
```

- **One route** for tools: `/tools/[slug]` (SSR SEO shell + lazy client UI)
- **One folder** per tool: `src/lib/tools/<id>/` (`index.ts` + `ui.svelte`)
- **Categories** are SEO landing pages (`src/lib/config/site.ts`)
- **Platform packs** are static homepage collections (no account required)
- **File tools** (image/PDF) run in the browser in v1—no uploads API in app code

Details: [docs/architecture.md](./docs/architecture.md). Contributing & `pnpm new-tool`: [CONTRIBUTING.md](./CONTRIBUTING.md).

## Production build & deployment

### Vercel (recommended)

This project uses **`@sveltejs/adapter-vercel`**. Deploy from the GitHub repo; leave the Output Directory blank (the adapter configures it).

1. Import the repo in Vercel
2. Framework preset: **SvelteKit** (or Other — build command `pnpm build`)
3. Set env vars (at least `PUBLIC_SITE_URL=https://heytools.app`)
4. Deploy — do **not** set Output Directory to `public` or `build`

```sh
pnpm build   # locally verifies the Vercel adapter output under .vercel/output
```

### Required production env

- `PUBLIC_SITE_URL=https://heytools.app` — must match the public origin users and crawlers see.
- Optional: Supabase, analytics, and ads vars from `.env.example`

### HTTPS / host policy (v1)

- On Vercel, HTTPS is automatic; point your custom domain and set `PUBLIC_SITE_URL` to that HTTPS origin.
- Prefer one canonical host (`apex` or `www`) and redirect the other in the Vercel domain settings.
- After go-live: verify share previews (home, one category, one tool) and Rich Results on home + sample tools.

### Security headers

The app sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and HSTS on HTTPS responses via `hooks.server.ts`.

## Stack

SvelteKit 2 · Svelte 5 · TypeScript · Tailwind CSS v4 · Valibot · Supabase (optional) · Vitest · Playwright · pnpm

## License

Add a `LICENSE` file for your chosen open-source license before publishing the repository publicly.
