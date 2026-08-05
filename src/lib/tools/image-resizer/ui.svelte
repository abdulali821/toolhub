<script lang="ts">
	import { Alert, Field, Input } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { imageResizer, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let width = $state<number | ''>('');
	let height = $state<number | ''>('');
	let keepAspect = $state(true);
	let naturalWidth = $state(0);
	let naturalHeight = $state(0);
	let outputWidth = $state(0);
	let outputHeight = $state(0);
	let processing = $state(false);

	async function processImage() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				width: width === '' ? undefined : Number(width),
				height: height === '' ? undefined : Number(height),
				keepAspect
			});
			outputDataUrl = out.dataUrl;
			outputWidth = out.width;
			outputHeight = out.height;
		} catch (err) {
			outputDataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to resize image';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.[^.]+$/, '');
		sourceDataUrl = await readFileAsDataUrl(file);
		outputDataUrl = '';

		const img = new Image();
		img.onload = () => {
			naturalWidth = img.naturalWidth;
			naturalHeight = img.naturalHeight;
			width = img.naturalWidth;
			height = img.naturalHeight;
			void processImage();
		};
		img.src = sourceDataUrl;
	}

	$effect(() => {
		if (!sourceDataUrl || !naturalWidth) return;
		void [width, height, keepAspect];
		void processImage();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-resized.png`,
			downloadMime: 'image/png',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
				width = '';
				height = '';
				keepAspect = true;
				naturalWidth = 0;
				naturalHeight = 0;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={imageResizer.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			outputDataUrl = '';
		}}
	/>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<p class="text-sm text-muted">Original: {naturalWidth} × {naturalHeight} px</p>

		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="ir-width" label="Width (px)">
				<Input id="ir-width" type="number" min="1" bind:value={width} />
			</Field>
			<Field id="ir-height" label="Height (px)">
				<Input id="ir-height" type="number" min="1" bind:value={height} />
			</Field>
		</div>

		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={keepAspect} />
			Keep aspect ratio
		</label>

		{#if processing}
			<p class="text-sm text-muted">Resizing…</p>
		{:else if outputDataUrl}
			<p class="text-sm text-muted">Output: {outputWidth} × {outputHeight} px</p>
			<img
				src={outputDataUrl}
				alt="Resized preview"
				class="h-auto max-h-64 max-w-full self-start rounded-md border border-border object-contain"
			/>
		{/if}
	{/if}
</div>
