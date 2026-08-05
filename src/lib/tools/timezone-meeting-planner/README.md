# Timezone Meeting Planner

Tool id: `timezone-meeting-planner`

Pick a date and time, then see that exact instant converted into a curated list of
IANA timezones (New York, London, Paris, Dubai, Karachi, Mumbai, Singapore, Tokyo,
Sydney, Los Angeles, Chicago, UTC). Useful for scheduling meetings across teams
without doing timezone math by hand.

## How it works

- The picked `datetime-local` value is treated as local wall-clock time in the
  browser's detected timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
- `run()` resolves that instant to UTC, then formats it into every selected zone
  using native `Intl.DateTimeFormat`/`toLocaleString` — no extra timezone library.
- Each result includes a `dayOffset` / `isOvernight` hint so you can tell when a
  city's calendar date differs from the date you picked (e.g. very late/early local
  time landing on the next or previous day).

## Develop

1. Core conversion logic lives in `run()` inside `index.ts`, along with the curated
   `TIMEZONE_PRESETS` list and IANA offset helpers.
2. UI in `ui.svelte`: datetime picker, city checkboxes, live results table, and
   copy-to-clipboard summary via the shared Action Bar.
3. Shareable state: `datetime` + comma-separated `zones` are synced to the URL via
   `pullShareState`/`pushShareState`.
4. Tests in `tests/tools/timezone-meeting-planner.test.ts` cover formatting,
   ordering (sorted west→east by UTC offset), and the overnight hint.
