# Image Tiler

Tool id: `image-tiler`

Repeat an image as a tiling background **in the browser** (canvas, no upload).

- **Live preview** — the same repeat a CSS `background` would use. If it seams, you see a grid.
- **Show tile edges** — magenta outlines on each cell so you can tell a real seam from texture.
- **Repeat / Mirror / Brick** — plus a non-AI 50% wrap + edge blend.
- **Download** the repeating unit (action bar) or a 1920×1080 wallpaper.

## Develop

Helpers live in `src/lib/utils/image-tile.ts` (layout, wrap-offset, blend). UI paints a live canvas; `run()` is for the engine / tests.
