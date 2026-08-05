# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Catalog is now **~102 tools** (up from **76** at v1.0.0).

### Added

- Barcode Generator (`barcode-generator`): CODE128, CODE39, EAN-13/8, UPC, ITF-14, Codabar, and MSI as browser-local PNG via JsBarcode
- Dark mode theme toggle (sun/moon) in the header, persisted via `localStorage` (default **light**)
- Markdown to PDF (`markdown-to-pdf`): browser-local PDF via `pdf-lib`, page thumbnail grid, eye-icon modal preview with prev/next
- CSS Animation Generator (`css-animation-generator`): `@keyframes` builder with live preview and a dropdown of built-in animations (fade, slide, bounce, pulse, spin, shake, zoom, flip, and more)
- Favicon Generator (`favicon-generator`): image or initials → PNG sizes, multi-res `.ico`, and HTML `<link>` snippet
- Timezone Meeting Planner (`timezone-meeting-planner`): compare a local datetime across world cities
- cURL to Fetch (`curl-to-fetch`): paste curl → JavaScript `fetch` or Axios
- CSV Viewer (`csv-viewer`): paste/upload CSV, filter, table preview
- Keyboard Tester (`keyboard-tester`): live key event inspector + QWERTY highlight
- Glassmorphism Generator (`glassmorphism-generator`): frosted-glass CSS with live preview
- Mic and Camera Tester (`device-tester`): local webcam/mic check with level meter
- **16** tools across waves 1–3:
  - Converters: `unit-converter`
  - Generators: `cron-generator`, `nanoid-generator`
  - Calculators: `date-calculator`, `aspect-ratio-calculator`, `tip-calculator`, `bmi-calculator`
  - Developer: `jwt-encoder`, `css-minifier`, `url-parser`
  - Color: `color-palette-generator`, `box-shadow-generator`
  - Text: `markdown-to-html`, `reading-time-estimator`
  - Data: `query-string-json`
  - Image: `image-watermark`

### Changed

- Shared UI and major routes use design tokens (`bg-bg`, `text-fg`, `border-border`, …) so light/dark themes stay consistent
- Homepage / Color & Design pack updated for newer color, CSS, generator, text, data, and image tools
- Markdown tools (`markdown-preview`, `markdown-to-html`, `markdown-to-pdf`) no longer live-sync document body into the URL; Share copies a short tool link. Presets still apply via a one-shot `?markdown=` that is stripped after load
- Nav dropdown animation no longer double-applies horizontal translate (menus align under triggers)
- SEO upgrades: `SearchAction` on WebSite JSON-LD, Organization `logo`, catalog/`CollectionPage`+`ItemList` schema, restored indexable `/categories` landings (sitemap + footer/internal links), removed noindexed `/search` from sitemap, `Disallow: /login`, default OG image (`og-default.png`) with correct dimensions

## [1.0.0] - 2026-07-21

First public release candidate of HeyTools: a free, SEO-first online tools platform with a plugin tool engine, browser-local processing for most workloads, and lean optional auth for favorites and history.

### Added

- Plugin tool engine with registry, dynamic `/tools/[slug]` routing, and code-split tool UIs
- **76** tools across **10** SEO categories: developer, text, data, image, pdf, color, encoders, converters, generators, calculators
- Image toolkit (compress, resize, crop, convert, metadata, color extract, SVG optimize, and related converters)
- PDF toolkit (merge, split, compress, rotate, extract/delete/reorder pages, images ↔ PDF, metadata)
- Encoding, color, generator, and text/data clusters with shared helpers
- Shareable tool state via URL query params, presets, related tools, and workflow “next step” links
- Global command palette (Ctrl/⌘K) for tools, categories, packs, and navigation
- Shared tool shell: ActionBar (copy, download, reset, share, favorite), FAQ, HowTo, breadcrumbs
- SEO layer: canonical URLs, Open Graph, Twitter cards, default OG image, sitemap, robots.txt
- Structured data: WebSite/Organization on home; WebApplication, BreadcrumbList, FAQPage, HowTo on tools
- Homepage platform collections (static curated tool packs)
- Optional Supabase auth with favorites and throttled tool history
- Simple Analytics in `app.html` and ads placeholder slots
- Scaffold script: `pnpm new-tool`
- Vitest unit tests and Playwright smoke e2e
- Vercel production adapter (`@sveltejs/adapter-vercel`)

### Changed

- Categories aligned to SEO clusters (legacy `/categories/dev` redirects to `/categories/developer`)
- Homepage copy clarified to “Shareable settings” (not all tools share binary state via URL)
- History writes throttled (update recent row within 30 minutes instead of unbounded inserts)
- Production docs and env contract centered on `PUBLIC_SITE_URL` (no trailing slash)
- Security response headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, HSTS on HTTPS
- Deploy target switched from Node (`adapter-node`) to **Vercel** (`adapter-vercel`)

### Fixed

- Listing pages emit full SEO metadata (canonical, OG, Twitter) via shared `SeoHead`
- Category page titles no longer duplicate the word “tools”
- Command palette focus trap, focus restore, and dialog keyboard behavior
- Alert live regions: assertive `role="alert"` for danger/warning
- Form fields wire `aria-describedby` for hints and errors
- File inputs in Dropzone and PDF merge expose accessible names
- Duplicate inline Copy buttons removed where ActionBar already provides copy
- Thin tool FAQs expanded; missing `howTo` steps added for SEO completeness

### Removed

- Unused uploads Storage/API path from application code (image/PDF tools remain browser-only in v1)
- Dependency on bare `adapter-auto` guesswork for production deploys
- `@sveltejs/adapter-node` in favor of `@sveltejs/adapter-vercel` for Vercel hosting

[Unreleased]: https://github.com/YOUR_ORG/heytools/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR_ORG/heytools/releases/tag/v1.0.0
