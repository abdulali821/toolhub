# HeyTools v1.0.0 — Release Notes

**HeyTools** is a free, SEO-first collection of online tools—not a SaaS. Version **1.0.0** is the first production-ready release candidate: fast pages, private-by-default processing, and a maintainable plugin architecture for shipping new tools without redesigning the platform.

## Highlights

### Privacy-first processing

Most tools—including text, data, encoding, color, **image**, and **PDF** workflows—run in your browser. Inputs stay on the device unless you opt into signed-in features (favorites and history). There is no requirement to create an account to use tools.

### 76 tools, one consistent experience

Every tool lives behind a single route (`/tools/[slug]`) with a shared shell: presets, ActionBar (copy / download / reset / share / favorite), FAQ, how-to steps, related tools, and workflow next steps. Catalog, search, categories, and a **Ctrl/⌘K** command palette make discovery consistent.

### Plugin architecture

Tools are plugins under `src/lib/tools/<id>/`. Each plugin declares metadata, validation (Valibot), `run` logic, and a lazy UI. The engine registry powers search, related scoring, and SEO shells without coupling tools to Supabase or routing details. Scaffold with `pnpm new-tool`.

### Image & PDF support

Local image compress/resize/crop/convert and a full PDF toolkit (merge, split, compress, rotate, page edit, images ↔ PDF) ship in v1. Heavy libraries load only on the tools that need them.

### SEO categories & structured data

Ten category landing pages, sitemap + robots, canonicals, Open Graph (including a default share image), and JSON-LD (Website/Organization on home; WebApplication, breadcrumbs, FAQ, HowTo on tools) support organic discovery.

### Accessibility improvements

Skip link, labeled form controls and file inputs, assertive alerts for errors, field descriptions for hints/errors, and a keyboard-friendly command palette with focus trap and restore form the v1 accessibility floor.

## Optional account features

With Supabase configured: sign-in, favorites, and throttled tool history. Auth pages are `noindex`. Analytics and ad slots are env-flagged and off by default.

## Known limitations

- **PDF “strong” compress** may rasterize pages (text becomes images)—documented in tool FAQ/UX.
- Binary image/PDF state is **not** shareable via URL; text/data tools that opt in use query params (large payloads may be omitted).
- Trending / recently-added rankings are **not** shipped in v1.0.0.
- Set `PUBLIC_SITE_URL` to your canonical HTTPS origin in production for correct sitemap, robots, and social previews.

## Upgrade / install

See [README.md](./README.md) for setup, environment variables, and Node deployment. See [CHANGELOG.md](./CHANGELOG.md) for the full list of Added / Changed / Fixed / Removed items.
