# cURL to Fetch

Tool id: `curl-to-fetch`

Paste a curl command (e.g. copied from a browser's Network tab or API docs) and get
equivalent JavaScript `fetch` or Axios code — method, headers, JSON/string body, and
basic auth (`-u`) all translated automatically.

## How it works

- `tokenizeCurl()` splits the command respecting single/double quotes and `\`
  line-continuations.
- `parseCurl()` walks the tokens, pulling out the URL, method (`-X`/`--request`),
  repeatable headers (`-H`/`--header`), body (`-d`/`--data*`), basic auth
  (`-u`/`--user`), and a rough `-F`/`--form` → `FormData` conversion. Unrecognized
  flags produce a warning instead of failing.
- `buildFetchCode()` / `buildAxiosCode()` render the parsed request as JavaScript,
  auto-detecting JSON bodies (by Content-Type or a leading `{`/`[`) and
  `JSON.stringify`-ing them; other bodies stay as plain strings.

## Sharing

Only the `target` (fetch/axios) toggle is stored in the URL — curl bodies can be
long or contain secrets, so pasted commands are never persisted or shared. Sample
curls used by presets are applied once from the URL and then stripped.

## Develop

1. Parsing/codegen logic lives in `index.ts` (`tokenizeCurl`, `parseCurl`,
   `buildFetchCode`, `buildAxiosCode`).
2. UI in `ui.svelte`: curl textarea, fetch/axios toggle, generated code, and
   warnings.
3. Tests in `tests/tools/curl-to-fetch.test.ts` cover GET with headers, POST with a
   JSON body, and basic auth.
