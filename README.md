# HeyTools

[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-red.svg)](./LICENSE)
[![Code of Conduct](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

Free, SEO-first **online tools** — not a SaaS.

Format, convert, generate, and transform text, data, images, and PDFs. Most tools run **in your browser** (privacy-first). Optional sign-in powers favorites and history.

**Live:** [https://heytools.app](https://heytools.app)

**Owner / maintainer:** Abdul Ali · **License:** [PolyForm Noncommercial 1.0.0](./LICENSE) (copyright remains with the owner; contribute and use non-commercially)

---

## Contributing

We want this repo open so people can **add tools** and improve the platform.

1. Read **[CONTRIBUTING.md](./CONTRIBUTING.md)** — setup, `pnpm new-tool`, PR checklist
2. Follow the **[Code of Conduct](./CODE_OF_CONDUCT.md)**
3. Report security issues via **[SECURITY.md](./SECURITY.md)**

### Quick: add a tool

```sh
pnpm install
cp .env.example .env
pnpm new-tool --id my-tool --name "My Tool" --category text
pnpm dev
```

Implement `src/lib/tools/my-tool/index.ts` + `ui.svelte`, add tests, open a PR.

---

## Community docs (repo root)

| Doc | Purpose |
| --- | ------- |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute and add tools |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Community standards |
| [SECURITY.md](./SECURITY.md) | Vulnerability reporting |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |
| [LICENSE](./LICENSE) | PolyForm Noncommercial — no commercial use |

---

## Requirements

- **Node.js** 22+ (LTS recommended)
- **pnpm** 9+

## Quick start

```sh
pnpm install
cp .env.example .env
pnpm dev
```

App: [http://localhost:5173](http://localhost:5173)

Supabase can stay unset for local tool browsing. Set `PUBLIC_SITE_URL` when testing canonicals, Open Graph, sitemap, or robots.

## Environment variables

Copy `.env.example` → `.env`. Never commit real secrets. Only `PUBLIC_*` values reach the client.

| Variable                               | Required            | Description                                                      |
| -------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `PUBLIC_SITE_URL`                      | **Production yes**  | Absolute origin, no trailing slash (e.g. `https://heytools.app`) |
| `PUBLIC_SUPABASE_URL`                  | For auth            | Supabase project URL                                             |
| `PUBLIC_SUPABASE_ANON_KEY`             | For auth            | Supabase anon / publishable key                                  |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only if used | **Never** expose to the browser                                  |
| `LOG_LEVEL`                            | No                  | `debug` \| `info` \| `warn` \| `error`                           |
| `PUBLIC_FF_AUTH`                       | No                  | Auth UI feature flag                                             |
| `PUBLIC_ADS_ENABLED`                   | No                  | Ad placeholder slots when `true`                                 |
| `PUBLIC_BACKGROUND_REMOVAL_ASSET_PATH` | No                  | Optional self-hosted path for on-device BG-removal assets        |

## Scripts

```sh
pnpm dev          # Dev server
pnpm check        # Types / svelte-check
pnpm lint         # Prettier check + ESLint
pnpm format       # Prettier write
pnpm test         # Vitest
pnpm test:e2e     # Playwright smoke
pnpm build        # Production build (Vercel adapter)
pnpm preview      # Preview production build
pnpm new-tool …   # Scaffold a tool plugin
```

**Quality gate:**

```sh
pnpm check && pnpm lint && pnpm test && pnpm build
```

## Architecture overview

```text
routes (thin) → engine (registry / contracts) → tools (plugins)
                    ↘ seo / ui / utils
features + supabase → favorites & history only (optional)
```

- **One route** for tools: `/tools/[slug]` (SSR SEO shell + lazy client UI)
- **One folder** per tool: `src/lib/tools/<id>/` (`index.ts` + `ui.svelte`)
- **Categories** in `src/lib/config/site.ts`
- **File tools** (image/PDF) stay browser-local when possible
- **Theme** defaults to light; dark mode is user-toggled (`localStorage`)

## Production (Vercel)

Uses `@sveltejs/adapter-vercel`.

1. Import the repo in Vercel
2. Framework: **SvelteKit** (build: `pnpm build`)
3. Set at least `PUBLIC_SITE_URL=https://heytools.app`
4. Do **not** set Output Directory to `public` or `build`

## Stack

SvelteKit 2 · Svelte 5 · TypeScript · Tailwind CSS v4 · Valibot · Supabase (optional) · Vitest · Playwright · pnpm

## License and ownership

Copyright © 2026 **Abdul Ali**. Licensed under the [PolyForm Noncommercial License 1.0.0](./LICENSE).

You may fork, study, modify, and contribute to make HeyTools better for everyone. You **may not** use this software (or a modified version) for a commercial purpose — including running a competing paid/ad-supported tools site, selling the code, or building a commercial product on top of it — without a separate license from the owner.

The **HeyTools** name and branding remain with the project owner. By opening a PR you agree to license your contribution under the same noncommercial terms.

### Third-party note

Some optional dependencies (for example on-device AI background removal via `@imgly/background-removal`) may use **different licenses** (e.g. AGPL). Review those package licenses before redistributing a build that includes them. See each package’s npm / LICENSE file.
