<script lang="ts">
	import { untrack } from 'svelte';
	import { Alert, Button, Field, Input } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { sampleImageColor } from '$lib/utils/image-canvas';
	import {
		beginBackgroundRemovalGeneration,
		cancelBackgroundRemovalJobs,
		isBackgroundRemovalModelReady,
		isBrowserAiRemovalSupported,
		removeBackgroundWithAi,
		type AiRemovalProgress
	} from '$lib/background-removal';
	import { backgroundRemover, run } from './index';

	const DEFAULT_TOLERANCE = 32;
	const DEFAULT_FEATHER = 8;
	const DEFAULT_COLOR = '#ffffff';

	type EngineMode = 'ai' | 'color' | 'wand';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let mode = $state<EngineMode>('ai');
	let color = $state(DEFAULT_COLOR);
	let tolerance = $state(DEFAULT_TOLERANCE);
	let feather = $state(DEFAULT_FEATHER);
	let seedX = $state<number | null>(null);
	let seedY = $state<number | null>(null);
	let processing = $state(false);
	let progressMessage = $state('Preparing AI…');
	let progressRatio = $state<number | null>(null);
	let aiSupported = $state(true);
	let hint = $state('Upload an image to remove the background with on-device AI.');
	let lastFailedAi = $state(false);

	const classicMode = $derived(mode === 'color' || mode === 'wand');

	function revokeIfBlobUrl(url: string) {
		if (url.startsWith('blob:')) URL.revokeObjectURL(url);
	}

	function clearOutput() {
		revokeIfBlobUrl(outputDataUrl);
		outputDataUrl = '';
	}

	function onAiProgress(p: AiRemovalProgress) {
		progressMessage = p.message;
		progressRatio = p.ratio ?? null;
	}

	async function processClassic() {
		if (!sourceDataUrl) return;
		if (untrack(() => processing)) return;
		if (mode === 'wand' && (seedX == null || seedY == null)) {
			clearOutput();
			hint = 'Click the background on the image to start the magic wand.';
			return;
		}
		processing = true;
		error = null;
		lastFailedAi = false;
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				mode,
				color,
				tolerance: Math.round(Number(tolerance)),
				feather: Math.round(Number(feather)),
				seedX: seedX ?? undefined,
				seedY: seedY ?? undefined
			});
			clearOutput();
			outputDataUrl = out.dataUrl;
			hint =
				mode === 'wand'
					? 'Click again to sample a different region.'
					: 'Click the image to sample a new key color, or edit the swatch.';
		} catch (err) {
			clearOutput();
			error = err instanceof Error ? err.message : 'Failed to remove background';
		} finally {
			processing = false;
		}
	}

	async function processAi() {
		if (!sourceDataUrl) return;
		if (untrack(() => processing)) return;
		if (!aiSupported) {
			error =
				'On-device AI isn’t available in this browser. Switch to Color key or Magic wand, or try Chrome, Edge, Firefox, or Safari.';
			return;
		}

		const generation = beginBackgroundRemovalGeneration();
		processing = true;
		error = null;
		lastFailedAi = false;
		progressMessage = isBackgroundRemovalModelReady()
			? 'Removing background…'
			: 'Preparing AI…';
		progressRatio = null;
		hint = isBackgroundRemovalModelReady()
			? 'Model is cached in this browser. Your image stays on-device.'
			: 'First run may download a model to your device. Your image stays in this browser.';

		try {
			const dataUrl = await removeBackgroundWithAi(sourceDataUrl, {
				generation,
				onProgress: onAiProgress
			});
			clearOutput();
			outputDataUrl = dataUrl;
			progressMessage = 'Background removed';
			hint = 'Download the transparent PNG, or upload another image.';
		} catch (err) {
			const message = err instanceof Error ? err.message : 'AI background removal failed';
			if (message === 'Cancelled') {
				return;
			}
			clearOutput();
			error = message;
			lastFailedAi = true;
		} finally {
			processing = false;
		}
	}

	async function processForCurrentMode() {
		if (mode === 'ai') await processAi();
		else await processClassic();
	}

	async function onselect(file: File) {
		cancelBackgroundRemovalJobs();
		error = null;
		lastFailedAi = false;
		fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
		clearOutput();
		seedX = null;
		seedY = null;
		sourceDataUrl = await readFileAsDataUrl(file);
		try {
			const sample = await sampleImageColor(sourceDataUrl, 0, 0);
			color = sample.hex;
		} catch {
			color = DEFAULT_COLOR;
		}
		await processForCurrentMode();
	}

	async function onImageClick(event: MouseEvent) {
		if (mode === 'ai' || untrack(() => processing)) return;
		const target = event.currentTarget as HTMLElement;
		const img = target instanceof HTMLImageElement ? target : target.querySelector('img');
		if (!img || !img.naturalWidth) return;
		const rect = img.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		const x = ((event.clientX - rect.left) / rect.width) * img.naturalWidth;
		const y = ((event.clientY - rect.top) / rect.height) * img.naturalHeight;
		seedX = Math.floor(x);
		seedY = Math.floor(y);
		try {
			const sample = await sampleImageColor(sourceDataUrl, seedX, seedY);
			color = sample.hex;
		} catch {
			/* keep previous color */
		}
		await processClassic();
	}

	function resetAll() {
		cancelBackgroundRemovalJobs();
		error = null;
		lastFailedAi = false;
		revokeIfBlobUrl(sourceDataUrl);
		clearOutput();
		sourceDataUrl = '';
		fileName = 'image';
		mode = 'ai';
		color = DEFAULT_COLOR;
		tolerance = DEFAULT_TOLERANCE;
		feather = DEFAULT_FEATHER;
		seedX = null;
		seedY = null;
		progressMessage = 'Preparing AI…';
		progressRatio = null;
		hint = 'Upload an image to remove the background with on-device AI.';
	}

	$effect(() => {
		aiSupported = isBrowserAiRemovalSupported();
		return () => {
			cancelBackgroundRemovalJobs();
		};
	});

	// Re-run classic when options change; AI is triggered on upload / mode select.
	$effect(() => {
		const nextMode = mode;
		void color;
		void tolerance;
		void feather;
		if (!sourceDataUrl) return;
		if (untrack(() => processing)) return;
		if (nextMode === 'ai') return;
		if (nextMode === 'wand' && seedX == null && seedY == null) {
			clearOutput();
			return;
		}
		void processClassic();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-no-background.png`,
			downloadMime: 'image/png',
			onReset: resetAll
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={backgroundRemover.file!}
		hint="PNG, JPEG, GIF, or WebP up to 5 MB"
		disabled={processing}
		{onselect}
		onerror={(message) => {
			error = message;
			cancelBackgroundRemovalJobs();
			clearOutput();
			sourceDataUrl = '';
		}}
	/>

	<p class="text-sm text-muted">
		Your image is processed directly in your browser. It isn't uploaded to our servers.
	</p>

	{#if !sourceDataUrl}
		<p class="text-sm text-muted">
			On-device AI for photos and products, plus classic color-key / magic wand for simple logos.
			The first AI run may download a model to your device.
		</p>
	{/if}

	{#if !aiSupported}
		<Alert variant="warning" title="AI unavailable">
			This browser can’t run on-device AI. Use Color key or Magic wand instead.
		</Alert>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">
			{error}
			{#if lastFailedAi}
				<div class="mt-3">
					<Button type="button" size="sm" variant="secondary" onclick={() => void processAi()}
						>Retry AI</Button
					>
				</div>
			{/if}
		</Alert>
	{/if}

	{#if sourceDataUrl}
		<div class="grid gap-3 sm:grid-cols-2">
			<Field id="br-mode" label="Mode">
				<select
					id="br-mode"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					value={mode}
					disabled={processing}
					onchange={(e) => {
						const value = (e.currentTarget as HTMLSelectElement).value as EngineMode;
						mode = value;
						clearOutput();
						error = null;
						if (value === 'ai') void processAi();
						else if (value === 'color') void processClassic();
						else {
							hint = 'Click the background on the image to start the magic wand.';
						}
					}}
				>
					<option value="ai" disabled={!aiSupported}>AI (on-device)</option>
					<option value="color">Color key (all matching pixels)</option>
					<option value="wand">Magic wand (connected region)</option>
				</select>
			</Field>

			{#if classicMode}
				<Field id="br-color" label="Key color">
					<div class="flex items-center gap-2">
						<input
							id="br-color-swatch"
							type="color"
							class="h-10 w-12 cursor-pointer rounded-md border border-border bg-bg p-1"
							bind:value={color}
							disabled={processing}
							aria-label="Background key color"
						/>
						<Input id="br-color" bind:value={color} class="font-mono text-sm" disabled={processing} />
					</div>
				</Field>
			{:else}
				<div class="flex items-end">
					<p class="text-sm text-muted">Subject is detected automatically—no color pick needed.</p>
				</div>
			{/if}
		</div>

		{#if classicMode}
			<div class="grid gap-3 sm:grid-cols-2">
				<Field id="br-tolerance" label="Tolerance ({tolerance})">
					<input
						id="br-tolerance"
						type="range"
						min="0"
						max="120"
						step="1"
						bind:value={tolerance}
						disabled={processing}
						class="w-full accent-fg"
					/>
				</Field>
				<Field id="br-feather" label="Feather ({feather})">
					<input
						id="br-feather"
						type="range"
						min="0"
						max="40"
						step="1"
						bind:value={feather}
						disabled={processing}
						class="w-full accent-fg"
					/>
				</Field>
			</div>
		{/if}

		<p class="text-sm text-muted">{hint}</p>

		{#if processing && mode === 'ai'}
			<div class="rounded-md border border-border bg-bg px-3 py-3" aria-live="polite">
				<p class="text-sm font-medium text-fg">{progressMessage}</p>
				{#if progressRatio != null}
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
						<div
							class="h-full rounded-full bg-fg transition-[width] duration-300"
							style={`width: ${Math.round(progressRatio * 100)}%`}
						></div>
					</div>
				{/if}
			</div>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<p class="mb-2 text-sm font-medium">
					{classicMode ? 'Original — click to sample' : 'Original'}
				</p>
				{#if classicMode}
					<button
						type="button"
						class="block w-full cursor-crosshair rounded-md border border-border p-0 text-left disabled:cursor-wait"
						onclick={onImageClick}
						disabled={processing}
					>
						<img
							src={sourceDataUrl}
							alt="Original — click to sample background"
							class="h-auto max-h-64 max-w-full self-start object-contain"
							draggable="false"
						/>
					</button>
				{:else}
					<img
						src={sourceDataUrl}
						alt="Original"
						class="h-auto max-h-64 max-w-full self-start rounded-md border border-border object-contain"
						draggable="false"
					/>
				{/if}
			</div>
			<div>
				<p class="mb-2 text-sm font-medium">Result (transparent PNG)</p>
				{#if processing}
					<p class="text-sm text-muted">
						{mode === 'ai' ? progressMessage : 'Removing background…'}
					</p>
				{:else if outputDataUrl}
					<div
						class="inline-flex max-w-full rounded-md border border-border p-2"
						style="background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0px; background-color: #fff;"
					>
						<img
							src={outputDataUrl}
							alt="Background removed preview"
							class="h-auto max-h-64 max-w-full self-start object-contain"
						/>
					</div>
				{:else}
					<p class="text-sm text-muted">
						{classicMode ? 'Preview appears after sampling.' : 'Preview appears when AI finishes.'}
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
