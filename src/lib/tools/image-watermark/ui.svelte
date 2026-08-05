<script lang="ts">
	import { Alert, Field, Input } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { imageWatermark, run, WATERMARK_POSITIONS, type WatermarkPosition } from './index';

	const DEFAULT_TEXT = '\u00A9 HeyTools';
	const DEFAULT_FONT_SIZE = 32;
	const DEFAULT_OPACITY = 0.6;
	const DEFAULT_POSITION: WatermarkPosition = 'bottom-right';

	const POSITION_LABEL: Record<WatermarkPosition, string> = {
		center: 'Center',
		'top-left': 'Top left',
		'top-right': 'Top right',
		'bottom-left': 'Bottom left',
		'bottom-right': 'Bottom right'
	};

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let text = $state(DEFAULT_TEXT);
	let fontSize = $state(DEFAULT_FONT_SIZE);
	let opacity = $state(DEFAULT_OPACITY);
	let position = $state<WatermarkPosition>(DEFAULT_POSITION);
	let processing = $state(false);

	async function processImage() {
		if (!sourceDataUrl || !text.trim()) {
			outputDataUrl = '';
			return;
		}
		processing = true;
		error = null;
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				text: text.trim(),
				fontSize: Math.round(Number(fontSize)),
				opacity: Math.min(1, Math.max(0, Number(opacity))),
				position
			});
			outputDataUrl = out.dataUrl;
		} catch (err) {
			outputDataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to watermark image';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.[^.]+$/, '');
		sourceDataUrl = await readFileAsDataUrl(file);
		await processImage();
	}

	$effect(() => {
		// Re-run whenever any watermark option changes.
		void text;
		void fontSize;
		void opacity;
		void position;
		if (sourceDataUrl) void processImage();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-watermarked.png`,
			downloadMime: 'image/png',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
				text = DEFAULT_TEXT;
				fontSize = DEFAULT_FONT_SIZE;
				opacity = DEFAULT_OPACITY;
				position = DEFAULT_POSITION;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={imageWatermark.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			outputDataUrl = '';
		}}
	/>

	{#if !sourceDataUrl}
		<p class="text-sm text-muted">Upload an image, then set the watermark text and position.</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<Field id="iw-text" label="Watermark text" required>
			<Input id="iw-text" bind:value={text} />
		</Field>

		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="iw-font-size" label="Font size (px)" hint="8–200">
				<Input id="iw-font-size" type="number" min="8" max="200" bind:value={fontSize} />
			</Field>
			<Field id="iw-opacity" label="Opacity" hint="0–1">
				<Input id="iw-opacity" type="number" min="0" max="1" step="0.05" bind:value={opacity} />
			</Field>
		</div>

		<Field id="iw-position" label="Position">
			<select
				id="iw-position"
				class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={position}
			>
				{#each WATERMARK_POSITIONS as p (p)}
					<option value={p}>{POSITION_LABEL[p]}</option>
				{/each}
			</select>
		</Field>

		{#if processing}
			<p class="text-sm text-muted">Applying watermark…</p>
		{:else if outputDataUrl}
			<div>
				<p class="mb-2 text-sm font-medium">Preview</p>
				<img
					src={outputDataUrl}
					alt="Watermarked preview"
					class="h-auto max-h-80 max-w-full self-start rounded-md border border-border object-contain"
				/>
			</div>
		{/if}
	{/if}
</div>
