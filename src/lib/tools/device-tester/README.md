# Mic and Camera Tester

Tool id: `device-tester`

Test a microphone and camera in the browser: live video preview, a mic level meter driven
by an `AnalyserNode`, and device selection for any connected audio/video inputs. Requires
a secure context (HTTPS or localhost) and explicit user permission.

## Develop

- Pure helpers (`formatDeviceLabel`, `computeAudioLevel`, `friendlyMediaError`, `run`) live
  in `index.ts` and are covered by tests without needing real media devices.
- `ui.svelte` owns all `navigator.mediaDevices` / `getUserMedia` / `AudioContext` calls and
  stops all tracks on Stop, Reset, and component destroy.
- Tests: `tests/tools/device-tester.test.ts`
