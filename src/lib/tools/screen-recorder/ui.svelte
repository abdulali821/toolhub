<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Alert, Button, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		MAX_RECORD_MS,
		WARN_RECORD_MS,
		defaultRecordingFilename,
		formatBytes,
		formatDuration,
		friendlyDisplayError,
		isDisplayCaptureSupported,
		makeRecordingSeekable,
		pickRecorderMimeType,
		run,
		sizeWarning,
		type ScreenRecorderOutput
	} from './index';

	const supported = isDisplayCaptureSupported();
	const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;
	const mimeType = pickRecorderMimeType();

	let includeMic = $state(true);
	let countdown = $state(0);
	let recording = $state(false);
	let fixingSeek = $state(false);
	let fixStatus = $state('');
	let elapsedMs = $state(0);
	let errorMessage = $state('');
	let infoMessage = $state('');
	let previewEl = $state<HTMLVideoElement | null>(null);
	let resultEl = $state<HTMLVideoElement | null>(null);

	let recordedBlob = $state<Blob | null>(null);
	let recordedUrl = $state('');
	let recordedMime = $state('video/webm');
	let recordedDurationMs = $state(0);
	let downloadName = $state('screen-recording.webm');

	let displayStream: MediaStream | null = null;
	let micStream: MediaStream | null = null;
	let combinedStream: MediaStream | null = null;
	let recorder: MediaRecorder | null = null;
	let chunks: BlobPart[] = [];
	let startedAt = 0;
	let tickId = 0;
	let countdownId = 0;
	let maxTimerId = 0;

	const summary = $derived.by((): ScreenRecorderOutput =>
		run({
			recorded: Boolean(recordedBlob),
			durationMs: recordedBlob ? recordedDurationMs : elapsedMs,
			byteSize: recordedBlob?.size ?? 0,
			mimeType: recordedMime,
			includeMic
		})
	);

	const warnLarge = $derived(recordedBlob ? sizeWarning(recordedBlob.size) : null);
	const nearLimit = $derived(recording && elapsedMs >= WARN_RECORD_MS);

	function revokeRecordedUrl() {
		if (recordedUrl.startsWith('blob:')) URL.revokeObjectURL(recordedUrl);
		recordedUrl = '';
	}

	function clearResult() {
		revokeRecordedUrl();
		recordedBlob = null;
		recordedDurationMs = 0;
		if (resultEl) resultEl.removeAttribute('src');
	}

	function stopTracks(stream: MediaStream | null) {
		if (!stream) return;
		for (const track of stream.getTracks()) track.stop();
	}

	function clearLivePreview() {
		if (previewEl) previewEl.srcObject = null;
	}

	function teardownStreams() {
		stopTracks(combinedStream);
		stopTracks(displayStream);
		stopTracks(micStream);
		combinedStream = null;
		displayStream = null;
		micStream = null;
		clearLivePreview();
	}

	function clearTimers() {
		if (tickId) {
			clearInterval(tickId);
			tickId = 0;
		}
		if (countdownId) {
			clearInterval(countdownId);
			countdownId = 0;
		}
		if (maxTimerId) {
			clearTimeout(maxTimerId);
			maxTimerId = 0;
		}
		countdown = 0;
	}

	function downloadRecording() {
		if (!recordedBlob) return;
		const href = URL.createObjectURL(recordedBlob);
		const a = document.createElement('a');
		a.href = href;
		a.download = downloadName;
		a.click();
		// Large videos need longer than 1s before revoke.
		setTimeout(() => URL.revokeObjectURL(href), 120_000);
	}

	function finishRecording(blob: Blob, duration: number) {
		clearResult();
		recordedBlob = blob;
		recordedMime = blob.type || recordedMime || 'video/webm';
		recordedDurationMs = duration;
		recordedUrl = URL.createObjectURL(blob);
		downloadName = defaultRecordingFilename(recordedMime);
		recording = false;
		fixingSeek = false;
		fixStatus = '';
		elapsedMs = duration;
		clearTimers();
		teardownStreams();
		recorder = null;
		chunks = [];
	}

	async function finalizeRecording(raw: Blob, duration: number) {
		recording = false;
		fixingSeek = true;
		fixStatus = 'Writing duration metadata…';
		clearTimers();
		teardownStreams();
		recorder = null;

		try {
			const seekable = await makeRecordingSeekable(raw, duration, (phase) => {
				fixStatus =
					phase === 'remuxing'
						? 'Building seek index (first time may take a moment)…'
						: 'Writing duration metadata…';
			});
			finishRecording(seekable, duration);
		} catch {
			finishRecording(raw, duration);
		}
	}

	function stopRecording() {
		infoMessage = '';
		if (recorder && recorder.state !== 'inactive') {
			try {
				recorder.stop();
			} catch {
				/* ignore */
			}
		} else {
			recording = false;
			clearTimers();
			teardownStreams();
		}
	}

	async function beginCapture() {
		errorMessage = '';
		infoMessage = '';
		clearResult();

		if (!supported) {
			errorMessage = 'Screen recording is not supported in this browser.';
			return;
		}
		if (!isSecureContext) {
			errorMessage = 'Screen recording requires HTTPS (or localhost).';
			return;
		}

		try {
			displayStream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					frameRate: { ideal: 30, max: 60 }
				},
				audio: true
			});
		} catch (err) {
			const name = err instanceof DOMException ? err.name : undefined;
			errorMessage = friendlyDisplayError(name);
			return;
		}

		const tracks: MediaStreamTrack[] = [...displayStream.getTracks()];

		if (includeMic) {
			try {
				micStream = await navigator.mediaDevices.getUserMedia({
					audio: {
						echoCancellation: true,
						noiseSuppression: true
					},
					video: false
				});
				tracks.push(...micStream.getAudioTracks());
			} catch (err) {
				stopTracks(displayStream);
				displayStream = null;
				const name = err instanceof DOMException ? err.name : undefined;
				errorMessage =
					name === 'NotAllowedError' || name === 'PermissionDeniedError'
						? 'Microphone permission denied. Turn off Include microphone, or allow the mic and try again.'
						: friendlyDisplayError(name);
				return;
			}
		}

		combinedStream = new MediaStream(tracks);

		const videoTrack = displayStream.getVideoTracks()[0];
		if (videoTrack) {
			videoTrack.addEventListener('ended', () => {
				if (recording) stopRecording();
			});
		}

		const options: MediaRecorderOptions = {};
		if (mimeType) options.mimeType = mimeType;

		try {
			recorder = new MediaRecorder(combinedStream, options);
		} catch {
			try {
				recorder = new MediaRecorder(combinedStream);
			} catch (err) {
				teardownStreams();
				errorMessage =
					err instanceof Error ? err.message : 'Could not create a MediaRecorder in this browser.';
				return;
			}
		}

		recordedMime = recorder.mimeType || mimeType || 'video/webm';
		chunks = [];
		startedAt = performance.now();
		elapsedMs = 0;
		recording = true;

		recorder.ondataavailable = (event) => {
			if (event.data.size > 0) chunks.push(event.data);
		};

		recorder.onerror = () => {
			errorMessage = 'Recording failed. Try again or use Chrome/Edge.';
			stopRecording();
		};

		recorder.onstop = () => {
			const duration = Math.max(0, performance.now() - startedAt);
			const type = recordedMime || 'video/webm';
			const blob = new Blob(chunks, { type });
			chunks = [];
			void finalizeRecording(blob, duration);
		};

		// No timeslice → one complete file on stop (still needs metadata fix below).
		recorder.start();

		tickId = window.setInterval(() => {
			elapsedMs = performance.now() - startedAt;
		}, 200);

		maxTimerId = window.setTimeout(() => {
			infoMessage = `Stopped at ${formatDuration(MAX_RECORD_MS)} (max length). Download your clip.`;
			stopRecording();
		}, MAX_RECORD_MS);
	}

	function startWithCountdown() {
		if (recording || countdown > 0) return;
		errorMessage = '';
		infoMessage = '';
		countdown = 3;
		countdownId = window.setInterval(() => {
			countdown -= 1;
			if (countdown <= 0) {
				clearInterval(countdownId);
				countdownId = 0;
				countdown = 0;
				void beginCapture();
			}
		}, 1000);
	}

	function cancelCountdown() {
		if (countdownId) {
			clearInterval(countdownId);
			countdownId = 0;
		}
		countdown = 0;
	}

	function resetAll() {
		cancelCountdown();
		if (recording) stopRecording();
		clearTimers();
		teardownStreams();
		clearResult();
		includeMic = true;
		elapsedMs = 0;
		errorMessage = '';
		infoMessage = '';
		fixingSeek = false;
		fixStatus = '';
		downloadName = 'screen-recording.webm';
	}

	$effect(() => {
		setToolShellActions({
			downloadValue: recordedUrl,
			downloadFilename: downloadName,
			downloadMime: recordedMime || 'video/webm',
			onReset: resetAll
		});
	});

	$effect(() => {
		if (recording && previewEl && combinedStream) {
			previewEl.srcObject = combinedStream;
			void previewEl.play().catch(() => {});
		}
	});

	$effect(() => {
		if (resultEl && recordedUrl) {
			resultEl.src = recordedUrl;
		}
	});

	onDestroy(() => {
		cancelCountdown();
		if (recorder && recorder.state !== 'inactive') {
			try {
				recorder.onstop = null;
				recorder.stop();
			} catch {
				/* ignore */
			}
		}
		clearTimers();
		teardownStreams();
		revokeRecordedUrl();
	});
</script>

<div class="flex flex-col gap-5">
	{#if !supported}
		<Alert variant="danger" title="Not supported">
			This browser does not support screen recording (getDisplayMedia / MediaRecorder).
		</Alert>
	{:else if !isSecureContext}
		<Alert variant="warning" title="HTTPS required">
			Screen recording requires HTTPS (or localhost during development).
		</Alert>
	{/if}

	{#if errorMessage}
		<Alert variant="danger" title="Could not record">{errorMessage}</Alert>
	{/if}

	{#if infoMessage}
		<Alert variant="info" title="Recording stopped">{infoMessage}</Alert>
	{/if}

	{#if fixingSeek}
		<Alert variant="info" title="Finishing file">
			{fixStatus || 'Making the recording seekable…'}
		</Alert>
	{/if}

	{#if nearLimit}
		<Alert variant="warning" title="Approaching limit">
			Auto-stop at {formatDuration(MAX_RECORD_MS)}. Download sooner for long sessions — the file
			lives in this tab’s memory until you save it.
		</Alert>
	{/if}

	{#if warnLarge}
		<Alert variant="warning" title="Large file">{warnLarge}</Alert>
	{/if}

	<Field id="sr-mic" label="Microphone">
		<label class="flex cursor-pointer items-center gap-3 text-sm text-fg">
			<input
				id="sr-mic"
				type="checkbox"
				class="size-4 accent-fg"
				bind:checked={includeMic}
				disabled={recording || countdown > 0 || fixingSeek || !supported}
			/>
			Include microphone (narration)
		</label>
		<p class="mt-1 text-sm text-muted">
			Tab/system audio is chosen in the browser share dialog (“Share audio”). Mic is optional and
			separate.
		</p>
	</Field>

	<div class="flex flex-wrap items-center gap-3">
		{#if recording}
			<Button type="button" variant="primary" size="sm" onclick={stopRecording}
				>Stop recording</Button
			>
			<span
				class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-sm text-fg"
				aria-live="polite"
			>
				<span class="size-2 animate-pulse rounded-full bg-red-500" aria-hidden="true"></span>
				{formatDuration(elapsedMs)}
			</span>
		{:else if fixingSeek}
			<Button type="button" variant="secondary" size="sm" disabled>Finishing…</Button>
			<span class="text-sm text-muted">{fixStatus}</span>
		{:else if countdown > 0}
			<Button type="button" variant="secondary" size="sm" onclick={cancelCountdown}>Cancel</Button>
			<span class="font-mono text-lg text-fg" aria-live="polite">{countdown}</span>
		{:else}
			<Button
				type="button"
				variant="primary"
				size="sm"
				onclick={startWithCountdown}
				disabled={!supported || !isSecureContext}
			>
				Start recording
			</Button>
		{/if}
	</div>

	<div
		class="flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-elevated"
	>
		{#if recording}
			<video
				bind:this={previewEl}
				class="h-full w-full object-contain"
				autoplay
				playsinline
				muted
				aria-label="Live screen preview"
			></video>
		{:else if recordedUrl}
			<video
				bind:this={resultEl}
				class="h-full w-full object-contain"
				controls
				playsinline
				aria-label="Recorded video preview"
			></video>
		{:else}
			<p class="p-4 text-center text-sm text-muted">
				Preview appears here after you start. Pick a tab, window, or screen when prompted.
			</p>
		{/if}
	</div>

	{#if recordedBlob && recordedUrl}
		<div class="flex flex-wrap items-center gap-3">
			<Button type="button" variant="primary" size="sm" onclick={downloadRecording}>
				Download {downloadName}
			</Button>
			<p class="text-sm text-muted">
				{formatDuration(recordedDurationMs)} · {formatBytes(recordedBlob.size)}
			</p>
		</div>
	{/if}

	<div class="rounded-xl border border-border bg-bg p-3">
		<p class="mb-2 text-sm font-medium text-fg">Status</p>
		<pre class="font-mono text-xs whitespace-pre-wrap text-muted">{summary.summary}</pre>
		<p class="mt-2 text-sm text-muted">
			Nothing is uploaded. Soft max {formatDuration(MAX_RECORD_MS)} per take so your browser stays comfortable.
		</p>
	</div>
</div>
