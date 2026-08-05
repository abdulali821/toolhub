# Glassmorphism Generator

Tool id: `glassmorphism-generator`

Design a frosted-glass CSS card visually — blur, saturation, background tint/opacity,
border opacity/width, corner radius, and an optional drop shadow — with a live preview
over a colorful gradient backdrop. All settings are shareable via the URL.

## Develop

- `run()` in `index.ts` returns `{ css, panelStyle, backgroundHint }`. `css` is a full
  `.glass { ... }` rule; `panelStyle` is the same declarations flattened for an inline
  `style` attribute used by the preview.
- `hexToRgba()` is the pure color helper covered by tests.
- Tests: `tests/tools/glassmorphism-generator.test.ts`
