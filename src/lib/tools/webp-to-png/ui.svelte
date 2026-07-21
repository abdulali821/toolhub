<script lang="ts">
	import { Alert } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { webpToPng, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let processing = $state(false);

	async function processImage() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			const out = await run({ dataUrl: sourceDataUrl });
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
		fileName = file.name.replace(/\.webp$/i, '');
		sourceDataUrl = await readFileAsDataUrl(file);
		outputDataUrl = '';
		await processImage();
	}

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}.png`,
			downloadMime: 'image/png',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={webpToPng.file!}
		hint="WebP only, up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			outputDataUrl = '';
		}}
	/>

	{#if !sourceDataUrl}
		<p class="text-sm text-muted">Upload a WebP file to convert it to PNG.</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		{#if processing}
			<p class="text-sm text-muted">Converting…</p>
		{:else if outputDataUrl}
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<p class="mb-2 text-sm font-medium">WebP</p>
					<img
						src={sourceDataUrl}
						alt="WebP source"
						class="max-h-48 w-auto rounded-md border border-border"
					/>
				</div>
				<div>
					<p class="mb-2 text-sm font-medium">PNG</p>
					<img
						src={outputDataUrl}
						alt="PNG output"
						class="max-h-48 w-auto rounded-md border border-border"
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>
