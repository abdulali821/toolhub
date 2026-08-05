# Keyboard Tester

Tool id: `keyboard-tester`

Interactive keyboard tester: focus the capture panel, press keys, and see `key`, `code`,
`keyCode`, `location`, and active modifiers update live. A visual QWERTY layout (keyed by
`KeyboardEvent.code`) highlights pressed keys, and the last 20 events are kept in a log.

Everything runs locally — no key events are sent anywhere.

## Develop

- Pure helpers (`formatKeyEvent`, `modifiersFromEvent`, `locationLabel`, `findKeyDef`,
  `KEYBOARD_ROWS`) live in `index.ts` and are covered by tests.
- The interactive capture, highlighting, and log live in `ui.svelte`.
- Tests: `tests/tools/keyboard-tester.test.ts`
