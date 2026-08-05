# CSV Viewer

Tool id: `csv-viewer`

Paste CSV text or upload a `.csv` file to preview it as a table, search across
every column, and copy the filtered rows back out as CSV or TSV.

## How it works

- `parseCsv()` is a small hand-written state machine that handles quoted fields
  (commas and newlines inside quotes) and doubled-quote (`""`) escapes.
- `run({ csv, query })` parses the text, treats the first row as headers, and
  filters the remaining rows with a case-insensitive substring match across every
  column.
- The table preview renders at most `MAX_PREVIEW_ROWS` (500) rows for performance;
  `run()` still reports the full row/column counts.

## Sharing

Only the `query` filter is stored in the URL — the CSV body itself is never put in
the URL (it can easily exceed practical URL length limits, and may contain
sensitive data).

## Develop

1. Parsing/serialization logic lives in `index.ts` (`parseCsv`, `rowsToCsv`,
   `rowsToTsv`).
2. UI in `ui.svelte`: file upload (`Dropzone`) or paste, search field, table
   preview, and copy/download via the shared Action Bar.
3. Tests in `tests/tools/csv-viewer.test.ts` cover quoted fields, embedded commas,
   newlines-in-quotes, and filtering.
