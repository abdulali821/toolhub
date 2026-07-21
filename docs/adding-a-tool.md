# Adding a Tool

Every tool is a plugin. Do not create a dedicated route file under `src/routes/tools/` for each tool.

## Fast path (recommended)

```bash
pnpm new-tool --id word-counter --name "Word Counter" --category text
```

Categories: `developer`, `text`, `data`, `image`, `pdf`, `color`, `encoders`, `converters`, `generators`, `calculators`. Prefer adding tools into an existing SEO cluster (next tool someone would need) rather than one-off utilities.

This scaffolds:

- `src/lib/tools/<id>/index.ts`
- `src/lib/tools/<id>/ui.svelte`
- `src/lib/tools/<id>/README.md`
- `tests/tools/<id>.test.ts`
- a registry import/entry in `src/lib/tools/registry.ts`

Then implement real `run()` logic and refine metadata.

## Manual steps

1. Create a folder: `src/lib/tools/<tool-id>/` (kebab-case id).
2. Add the canonical files:

```text
src/lib/tools/json-formatter/
├── index.ts          # exports ToolDefinition
├── ui.svelte         # tool UI (use $ui primitives)
└── README.md
```

3. Register the tool in `src/lib/tools/registry.ts`.
4. Add unit tests under `tests/tools/`.

## Rules

- `run` must be pure (no DOM, no Supabase) unless marked server-only.
- Reuse `$ui` components; do not invent one-off buttons/inputs.
- Put SEO content in tool `metadata` — never duplicate SEO in the tool UI.
- Keep heavy dependencies behind dynamic imports so they do not inflate the shared bundle.

## File / upload tools

For client-side file tools (mode `upload` or `hybrid`):

1. Declare constraints on the tool definition:

```ts
file: {
  maxBytes: 2 * 1024 * 1024,
  accept: 'image/png,image/jpeg',
  mimeAllowlist: ['image/png', 'image/jpeg'],
  extensions: ['.png', '.jpg', '.jpeg']
}
```

2. Use `$ui` `Dropzone` with those constraints (`onselect` / `onerror`).
3. Validate again with `validateFile` from `$lib/utils/file` if needed, then `readFileAsText` or `readFileAsDataUrl`.
4. Keep processing in the browser unless you intentionally use Supabase Storage (`uploads` bucket) for larger server-backed flows.

## Platform UX checklist

When shipping a tool, consider these optional `ToolDefinition` fields so the shared shell can help users finish tasks faster:

| Field                             | Purpose                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`                    | Enable shell actions: `copy`, `download`, `share`, `reset`, `favorite`, etc. |
| `share.params`                    | Query keys serialized to the URL for bookmark/share                          |
| `presets`                         | Named param packs (e.g. “Pretty Print”, “Strong Password”)                   |
| `workflow.next` / `workflow.prev` | Logical next/previous tools in a chain                                       |
| `metadata.related`                | Manual related-tool links (also used by scorer)                              |

**Shareable state:** Prefer URL query params for input/options users may want to bookmark or share. Declare keys in `share.params`.

**localStorage:** Use `$lib/utils/local-prefs.ts` for drafts, last-used options, or prefs that should not go in the URL. Never store temporary UI state in Supabase.

**Presets:** Each preset is `{ id, label, params }` where `params` maps to URL query keys—no database.

See [architecture.md](./architecture.md#platform-ux-capabilities) for the full UX platform model.

## After registration

The engine route `/tools/[slug]` will render the shared shell (breadcrumbs, FAQ, related tools, SEO) and mount your UI chunk automatically.
