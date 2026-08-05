<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Alert, Button, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		formatDeviceLabel,
		computeAudioLevel,
		friendlyMediaError,
		run,
		type TestMode
	} from './index';

	type DeviceOption = { deviceId: string; label: string };

	const mediaSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
	const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;

	let mode = $state<TestMode>('mic');
	let audioDevices = $state<DeviceOption[]>([]);
	let videoDevices = $state<DeviceOption[]>([]);
	let selectedAudioId = $state('');
	let selectedVideoId = $state('');
	let isRunning = $state(false);
	let micGranted = $state(false);
	let cameraGranted = $state(false);
	let micLevel = $state(0);
	let errorMessage = $state('');

	let videoEl: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | null = null;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let dataArray: Uint8Array<ArrayBuffer> | null = null;
	let rafId = 0;

	let wantMic = $derived(mode === 'mic' || mode === 'both');
	let wantCamera = $derived(mode === 'camera' || mode === 'both');

	let status = $derived(
		run({
			mode,
			micGranted,
			cameraGranted,
			audioInputCount: audioDevices.length,
			videoInputCount: videoDevices.length
		})
	);

	async function refreshDeviceList() {
		if (!mediaSupported) return;
		const devices = await navigator.mediaDevices.enumerateDevices();
		audioDevices = devices
			.filter((d) => d.kind === 'audioinput')
			.map((d, i) => ({ deviceId: d.deviceId, label: formatDeviceLabel(d, i) }));
		videoDevices = devices
			.filter((d) => d.kind === 'videoinput')
			.map((d, i) => ({ deviceId: d.deviceId, label: formatDeviceLabel(d, i) }));
		if (!selectedAudioId && audioDevices[0]) selectedAudioId = audioDevices[0].deviceId;
		if (!selectedVideoId && videoDevices[0]) selectedVideoId = videoDevices[0].deviceId;
	}

	function stopMeter() {
		if (rafId) cancelAnimationFrame(rafId);
		rafId = 0;
		analyser = null;
		dataArray = null;
		if (audioContext) {
			audioContext.close().catch(() => {});
			audioContext = null;
		}
	}

	function stopStream() {
		stopMeter();
		if (stream) {
			for (const track of stream.getTracks()) track.stop();
			stream = null;
		}
		if (videoEl) videoEl.srcObject = null;
		isRunning = false;
		micGranted = false;
		cameraGranted = false;
		micLevel = 0;
	}

	function meterLoop() {
		if (!analyser || !dataArray) return;
		analyser.getByteTimeDomainData(dataArray);
		micLevel = computeAudioLevel(dataArray);
		rafId = requestAnimationFrame(meterLoop);
	}

	function audioConstraint(): MediaTrackConstraints | boolean {
		if (!wantMic) return false;
		if (selectedAudioId) return { deviceId: { ideal: selectedAudioId } };
		return true;
	}

	function videoConstraint(): MediaTrackConstraints | boolean {
		if (!wantCamera) return false;
		if (selectedVideoId) return { deviceId: { ideal: selectedVideoId } };
		return true;
	}

	async function start() {
		errorMessage = '';
		if (!mediaSupported) {
			errorMessage = 'Camera/microphone access is not supported in this browser.';
			return;
		}
		if (!isSecureContext) {
			errorMessage = 'Camera/microphone access requires HTTPS (or localhost).';
			return;
		}
		if (wantCamera && videoDevices.length === 0) {
			await refreshDeviceList();
		}
		if (wantCamera && videoDevices.length === 0) {
			errorMessage =
				'No camera was detected. Switch to “Microphone only” if you only want to test your mic.';
			return;
		}
		if (wantMic && audioDevices.length === 0) {
			await refreshDeviceList();
		}

		stopStream();
		try {
			const constraints: MediaStreamConstraints = {
				audio: audioConstraint(),
				video: videoConstraint()
			};
			stream = await navigator.mediaDevices.getUserMedia(constraints);
			isRunning = true;
			micGranted = stream.getAudioTracks().length > 0;
			cameraGranted = stream.getVideoTracks().length > 0;

			if (wantCamera && videoEl) {
				videoEl.srcObject = stream;
			} else if (videoEl) {
				videoEl.srcObject = null;
			}

			await refreshDeviceList();

			const audioTrack = stream.getAudioTracks()[0];
			if (audioTrack) {
				audioContext = new AudioContext();
				if (audioContext.state === 'suspended') await audioContext.resume();
				const source = audioContext.createMediaStreamSource(stream);
				analyser = audioContext.createAnalyser();
				analyser.fftSize = 512;
				dataArray = new Uint8Array(analyser.fftSize);
				source.connect(analyser);
				meterLoop();
			}
		} catch (err) {
			isRunning = false;
			const name = err instanceof DOMException ? err.name : undefined;
			errorMessage = friendlyMediaError(name, mode);
		}
	}

	function stop() {
		stopStream();
	}

	async function onModeChange(next: TestMode) {
		mode = next;
		errorMessage = '';
		if (isRunning) await start();
	}

	async function onDeviceChange() {
		if (isRunning) await start();
	}

	function resetAll() {
		stopStream();
		errorMessage = '';
		selectedAudioId = '';
		selectedVideoId = '';
		mode = 'mic';
	}

	$effect(() => {
		if (!mediaSupported) return;
		navigator.mediaDevices.addEventListener('devicechange', refreshDeviceList);
		refreshDeviceList();
		return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDeviceList);
	});

	$effect(() => {
		setToolShellActions({ onReset: resetAll });
	});

	onDestroy(() => {
		stopStream();
	});
</script>

<div class="flex flex-col gap-5">
	{#if !mediaSupported}
		<Alert variant="danger" title="Not supported">
			This browser does not support camera/microphone access (getUserMedia).
		</Alert>
	{:else if !isSecureContext}
		<Alert variant="warning" title="HTTPS required">
			Camera/microphone access requires HTTPS (or localhost during development).
		</Alert>
	{/if}

	{#if errorMessage}
		<Alert variant="danger" title="Could not access device">{errorMessage}</Alert>
	{/if}

	<Field id="dt-mode" label="What to test">
		<select
			id="dt-mode"
			class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
			value={mode}
			onchange={(e) => void onModeChange((e.currentTarget as HTMLSelectElement).value as TestMode)}
			disabled={!mediaSupported}
		>
			<option value="mic">Microphone only</option>
			<option value="camera">Camera only</option>
			<option value="both">Microphone + camera</option>
		</select>
	</Field>

	<div class="grid gap-4 sm:grid-cols-2">
		{#if wantMic}
			<Field id="dt-audio" label="Microphone">
				<select
					id="dt-audio"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={selectedAudioId}
					onchange={onDeviceChange}
					disabled={!mediaSupported}
				>
					{#if !audioDevices.length}
						<option value="">No microphones detected yet</option>
					{/if}
					{#each audioDevices as device (device.deviceId)}
						<option value={device.deviceId}>{device.label}</option>
					{/each}
				</select>
			</Field>
		{/if}
		{#if wantCamera}
			<Field id="dt-video" label="Camera">
				<select
					id="dt-video"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={selectedVideoId}
					onchange={onDeviceChange}
					disabled={!mediaSupported}
				>
					{#if !videoDevices.length}
						<option value="">No cameras detected yet</option>
					{/if}
					{#each videoDevices as device (device.deviceId)}
						<option value={device.deviceId}>{device.label}</option>
					{/each}
				</select>
			</Field>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2">
		{#if !isRunning}
			<Button type="button" variant="primary" size="sm" onclick={start} disabled={!mediaSupported}>
				Start test
			</Button>
		{:else}
			<Button type="button" variant="secondary" size="sm" onclick={stop}>Stop</Button>
		{/if}
	</div>

	<div class="flex flex-col gap-3 sm:flex-row">
		{#if wantCamera}
			<div
				class="flex aspect-video flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-elevated"
			>
				<video
					bind:this={videoEl}
					autoplay
					playsinline
					muted
					class="h-full w-full object-cover {isRunning && cameraGranted ? '' : 'hidden'}"
					aria-label="Camera preview"
				></video>
				{#if !isRunning || !cameraGranted}
					<p class="p-4 text-center text-sm text-muted">Camera preview will appear here</p>
				{/if}
			</div>
		{:else}
			<div
				class="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-bg p-6 text-center text-sm text-muted"
			>
				Camera preview hidden — you’re in microphone-only mode.
			</div>
		{/if}

		{#if wantMic}
			<div class="flex w-full flex-col gap-2 sm:w-40">
				<p class="text-sm font-medium text-fg">Mic level</p>
				<div class="h-3 w-full overflow-hidden rounded-full bg-bg-elevated">
					<div
						class="h-full rounded-full bg-accent transition-[width] duration-75"
						style="width: {Math.round(micLevel * 100)}%"
					></div>
				</div>
				<p class="text-xs text-muted">Speak or make noise to see the meter move.</p>
			</div>
		{/if}
	</div>

	<div class="rounded-xl border border-border bg-bg p-3">
		<p class="mb-2 text-sm font-medium text-fg">Status</p>
		<pre class="font-mono text-xs whitespace-pre-wrap text-muted">{status.checklist}</pre>
	</div>
</div>
