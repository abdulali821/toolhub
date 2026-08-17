# Image Splitter

Tool id: `image-splitter`

Split one image into multiple pieces in the browser (vertical, horizontal, or grid).

- Equal row/column counts or fixed block size in pixels
- Optional overlap between adjacent pieces
- PNG / JPEG / WebP output (or same as input)
- Per-piece download + ZIP of all tiles

Inspired by [PineTools split image](https://pinetools.com/split-image); logic lives in `src/lib/utils/image-split.ts`.
