<script lang="ts">
	import { Alert, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { rotateImage, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let degrees = $state<90 | 180 | 270>(90);
	let processing = $state(false);

	async function processImage() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			const out = await run({ dataUrl: sourceDataUrl, degrees });
			outputDataUrl = out.dataUrl;
		} catch (err) {
			outputDataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to rotate image';
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
		void degrees;
		void processImage();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-rotated.png`,
			downloadMime: 'image/png',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
				degrees = 90;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={rotateImage.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			outputDataUrl = '';
		}}
	/>

	{#if !sourceDataUrl}
		<p class="text-sm text-muted">Upload an image to rotate it.</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<Field id="ri-degrees" label="Rotation">
			<select
				id="ri-degrees"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={degrees}
			>
				<option value={90}>90° clockwise</option>
				<option value={180}>180°</option>
				<option value={270}>270° clockwise (90° counter-clockwise)</option>
			</select>
		</Field>

		{#if processing}
			<p class="text-sm text-muted">Rotating…</p>
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
					<p class="mb-2 text-sm font-medium">Rotated</p>
					<img
						src={outputDataUrl}
						alt="Rotated preview"
						class="max-h-48 w-auto rounded-md border border-border"
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>
