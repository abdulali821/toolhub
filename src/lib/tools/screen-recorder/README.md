# Screen Recorder

Tool id: `screen-recorder`

Record a browser tab, window, or screen locally with optional microphone, then download
WebM/MP4. Uses `getDisplayMedia` + `MediaRecorder` — nothing is uploaded.

After stop, the WebM is patched (duration + remux) so VLC and other players get a working
seek / progress bar — raw MediaRecorder output is a “live” stream without that metadata.

- Optional mic narration
- System/tab audio via the browser share dialog
- Soft max length (10 minutes) to limit in-tab memory
- Tests: `tests/tools/screen-recorder.test.ts`
