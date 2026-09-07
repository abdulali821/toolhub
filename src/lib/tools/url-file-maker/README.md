# URL File Maker

Create Windows Internet Shortcut (`.url`) files from a URL.

## Files

- `index.ts` — normalize URL, sanitize file name, build `[InternetShortcut]` content
- `ui.svelte` — URL + optional name, live preview, download via Action Bar

## Notes

- Content uses CRLF line endings for Windows compatibility
- Scheme is defaulted to `https://` when omitted
