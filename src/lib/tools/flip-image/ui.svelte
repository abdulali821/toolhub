<script lang="ts">
	import { Alert, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { flipImage, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let axis = $state<'horizontal' | 'vertical' | 'both'>('horizontal');
	let processing = $state(false);

	async function processImage() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			const out = await run({ dataUrl: sourceDataUrl, axis });
			outputDataUrl = out.dataUrl;
		} catch (err) {
			outputDataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to flip image';
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
		void axis;
		void processImage();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-flipped.png`,
			downloadMime: 'image/png',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
				axis = 'horizontal';
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={flipImage.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			outputDataUrl = '';
		}}
	/>

	{#if !sourceDataUrl}
		<p class="text-sm text-muted">Upload an image to flip or mirror it.</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<Field id="fi-axis" label="Flip axis">
			<select
				id="fi-axis"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={axis}
			>
				<option value="horizontal">Horizontal (mirror left-right)</option>
				<option value="vertical">Vertical (mirror top-bottom)</option>
				<option value="both">Both</option>
			</select>
		</Field>

		{#if processing}
			<p class="text-sm text-muted">Flipping…</p>
		{:else if outputDataUrl}
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<p class="mb-2 text-sm font-medium">Original</p>
					<img
						src={sourceDataUrl}
						alt="Original"
						class="h-auto max-h-48 max-w-full self-start rounded-md border border-border object-contain"
					/>
				</div>
				<div>
					<p class="mb-2 text-sm font-medium">Flipped</p>
					<img
						src={outputDataUrl}
						alt="Flipped preview"
						class="h-auto max-h-48 max-w-full self-start rounded-md border border-border object-contain"
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>
