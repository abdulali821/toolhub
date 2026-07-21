<script lang="ts">
	import { Alert, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { jpgToWebp, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let quality = $state(0.85);
	let processing = $state(false);

	async function processImage() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			const out = await run({ dataUrl: sourceDataUrl, quality: Number(quality) });
			outputDataUrl = out.dataUrl;
		} catch (err) {
			outputDataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to convert image';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.(jpe?g)$/i, '');
		sourceDataUrl = await readFileAsDataUrl(file);
		outputDataUrl = '';
		await processImage();
	}

	$effect(() => {
		if (!sourceDataUrl) return;
		void quality;
		void processImage();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}.webp`,
			downloadMime: 'image/webp',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
				quality = 0.85;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={jpgToWebp.file!}
		hint="JPEG only, up to 2 MB"
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
		<Field id="jw-quality" label="WebP quality" hint="0.1–1">
			<input
				id="jw-quality"
				type="range"
				min="0.1"
				max="1"
				step="0.05"
				bind:value={quality}
				class="w-full"
			/>
			<p class="mt-1 text-sm text-muted">{Number(quality).toFixed(2)}</p>
		</Field>

		{#if processing}
			<p class="text-sm text-muted">Converting…</p>
		{:else if outputDataUrl}
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<p class="mb-2 text-sm font-medium">JPEG</p>
					<img
						src={sourceDataUrl}
						alt="JPEG source"
						class="max-h-48 w-auto rounded-md border border-border"
					/>
				</div>
				<div>
					<p class="mb-2 text-sm font-medium">WebP</p>
					<img
						src={outputDataUrl}
						alt="WebP output"
						class="max-h-48 w-auto rounded-md border border-border"
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>
