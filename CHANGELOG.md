# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- Env-flagged Plausible / Simple Analytics and ads placeholder slots
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
