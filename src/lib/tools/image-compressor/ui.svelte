<script lang="ts">
	import { Alert, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { formatBytes } from '$lib/utils/bytes';
	import { imageCompressor, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let quality = $state(0.82);
	let format = $state<'jpeg' | 'webp'>('jpeg');
	let processing = $state(false);

	async function processImage() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				quality: Number(quality),
				format
			});
			outputDataUrl = out.dataUrl;
		} catch (err) {
			outputDataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to compress image';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.[^.]+$/, '');
		sourceDataUrl = await readFileAsDataUrl(file);
		outputDataUrl = '';
		await processImage();
	}

	$effect(() => {
		if (!sourceDataUrl) return;
		void [quality, format];
		void processImage();
	});

	$effect(() => {
		const ext = format === 'webp' ? 'webp' : 'jpg';
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-compressed.${ext}`,
			downloadMime: format === 'webp' ? 'image/webp' : 'image/jpeg',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
				quality = 0.82;
				format = 'jpeg';
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={imageCompressor.file!}
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
		<Field id="ic-quality" label="Quality" hint="0.1–1">
			<input
				id="ic-quality"
				type="range"
				min="0.1"
				max="1"
				step="0.05"
				bind:value={quality}
				class="w-full"
			/>
			<p class="mt-1 text-sm text-muted">{Number(quality).toFixed(2)}</p>
		</Field>

		<Field id="ic-format" label="Output format">
			<select
				id="ic-format"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={format}
			>
				<option value="jpeg">JPEG</option>
				<option value="webp">WebP</option>
			</select>
		</Field>

		{#if processing}
			<p class="text-sm text-muted">Compressing…</p>
		{:else if outputDataUrl}
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<p class="mb-2 text-sm font-medium">Original</p>
					<img
						src={sourceDataUrl}
						alt="Original"
						class="max-h-48 w-auto rounded-md border border-border"
					/>
				</div>
				<div>
					<p class="mb-2 text-sm font-medium">Compressed</p>
					<img
						src={outputDataUrl}
						alt="Compressed"
						class="max-h-48 w-auto rounded-md border border-border"
					/>
					<p class="mt-2 text-xs text-muted">
						≈ {formatBytes(Math.round(outputDataUrl.length * 0.75))} (data URL size estimate)
					</p>
				</div>
			</div>
		{/if}
	{/if}
</div>
