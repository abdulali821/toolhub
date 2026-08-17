# Background Remover

Remove backgrounds in the browser:

- **AI (default)** — `@imgly/background-removal` + `onnxruntime-web` (ONNX/WASM). Image stays on-device; model assets may download once and cache.
- **Color key / Magic wand** — classic canvas algorithms for logos and solid backdrops.
- **Eraser** — after removal, paint on the result to restore original pixels (adjustable circular brush).

## Config

Optional self-hosted assets:

```bash
PUBLIC_BACKGROUND_REMOVAL_ASSET_PATH=https://cdn.example.com/background-removal/
```

Leave unset to use the library default CDN during development.

## Note

`@imgly/background-removal` is AGPL-licensed for free use. Review licensing for your distribution model.
