# Contributing to HeyTools

Thanks for helping improve **HeyTools** — a free, privacy-first online tools platform.

By participating, you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

**Copyright:** the project is owned and maintained by **Abdul Ali**. Contributors keep copyright on their own contributions and license them to the project under the same [PolyForm Noncommercial License 1.0.0](./LICENSE) (see the PR checklist). Commercial use of HeyTools (or a competing product built from this code) is not allowed.

## Ways to contribute

- **Add a tool** — the most valuable contribution
- Fix bugs or improve UX/a11y on existing tools
- Improve tests, SEO metadata, or docs at the repo root
- Report bugs / request tools via GitHub Issues

Please open an issue before large refactors or new product directions (billing, public APIs, etc.).

## Project structure

| Path                   | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `src/routes`           | Thin SvelteKit pages and endpoints            |
| `src/lib/engine`       | Plugin contracts, registry, share-state       |
| `src/lib/tools/<id>/`  | One folder per tool (`index.ts`, `ui.svelte`) |
| `src/lib/seo`          | Metadata and JSON-LD builders                 |
| `src/lib/ui`           | Shared UI components                          |
| `src/lib/features`     | Favorites / history (optional Supabase)       |
| `src/lib/config`       | Site name, categories, collections            |
| `tests/tools`          | Vitest tests per tool                         |
| `scripts/new-tool.mjs` | Tool scaffold CLI                             |

**Aliases:** `$lib`, `$engine`, `$tools`, `$seo`, `$ui`, `$server`.

**Layer rule:** tool plugins must **not** import Supabase or feature APIs. Routes stay thin; logic lives in engine / utils / tools.

Architecture snapshot:

```text
routes (thin) → engine (registry) → tools (plugins)
                    ↘ seo / ui / utils
```

- One route for all tools: `/tools/[slug]`
- One folder per tool under `src/lib/tools/<id>/`
- Prefer **browser-local** processing (especially image/PDF)

## Development setup

Requirements: **Node.js 22+**, **pnpm 9+**.

```sh
pnpm install
cp .env.example .env
pnpm dev
```

App: http://localhost:5173

Supabase env vars are optional for local tool work.

## Adding a new tool

```sh
pnpm new-tool --id my-tool --name "My Tool" --category text
```

Categories: `developer` · `text` · `data` · `image` · `pdf` · `color` · `encoders` · `converters` · `generators` · `calculators`

Then:

1. Implement `run` + Valibot `inputSchema` in `src/lib/tools/<id>/index.ts`
2. Build `ui.svelte` with `$ui` components
3. Fill SEO: `title`, `description`, `keywords`, **faq** (2–3+), **howTo**, `related`
4. Set `capabilities`, `share.params`, `presets` when useful
   - Keep share params small — do **not** put large documents in the URL
5. Expand `tests/tools/<id>.test.ts`
6. Verify `/tools/<id>` (SSR shell + client UI)
7. Use theme tokens (`bg-bg`, `text-fg`, `border-border`, …)

## Coding conventions

- TypeScript + Svelte 5 runes (`$state`, `$derived`, `$props`)
- Validate with Valibot; keep `run` testable when possible
- Reuse `$ui` and shared utils — no one-off design systems
- Match surrounding style; no unrelated drive-by refactors
- No secrets in commits (`.env`, service role keys, …)

## Testing before a PR

```sh
pnpm check
pnpm lint
pnpm test
```

If you touch routes/navigation:

```sh
pnpm test:e2e
```

Format with `pnpm format` if needed.

## Pull request process

1. Fork the repo (or use a branch if you have write access)
2. Create a focused branch: `feat/my-tool` or `fix/…`
3. Make your changes + tests
4. Open a PR with a clear description of **why**
5. Maintainers review; address feedback

### PR checklist

- [ ] I agree to license my contribution under the PolyForm Noncommercial License 1.0.0
- [ ] Scope is focused; no unrelated refactors
- [ ] New/changed tools include faq, howTo, related metadata
- [ ] Tool plugin does not import Supabase/features
- [ ] `pnpm check`, `pnpm lint`, and `pnpm test` pass
- [ ] `CHANGELOG.md` updated under `[Unreleased]` when user-facing
- [ ] No secrets committed

## Bugs and security

- Bugs / features: GitHub Issues
- Vulnerabilities: follow [SECURITY.md](./SECURITY.md) — do **not** file public exploit details

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Enforcement contact: **abdul.ali@poshmaals.com**.
