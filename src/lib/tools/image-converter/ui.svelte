<script lang="ts">
	import { Alert, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { imageConverter, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let format = $state<'png' | 'jpeg' | 'webp'>('png');
	let quality = $state(0.92);
	let processing = $state(false);

	const ext = $derived(format === 'jpeg' ? 'jpg' : format);
	const mime = $derived(
		format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
	);

	async function convert() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				format,
				quality: Number(quality)
			});
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
		fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
		sourceDataUrl = await readFileAsDataUrl(file);
		outputDataUrl = '';
		await convert();
	}

	$effect(() => {
		if (!sourceDataUrl) return;
		void [format, quality];
		void convert();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}.${ext}`,
			downloadMime: mime,
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
				format = 'png';
				quality = 0.92;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={imageConverter.file!}
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
		<Field id="ic-format" label="Output format">
			<select
				id="ic-format"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={format}
			>
				<option value="png">PNG</option>
				<option value="jpeg">JPEG</option>
				<option value="webp">WebP</option>
			</select>
		</Field>

		{#if format !== 'png'}
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
		{/if}

		{#if processing}
			<p class="text-sm text-muted">Converting…</p>
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
					<p class="mb-2 text-sm font-medium">Converted ({format.toUpperCase()})</p>
					<img
						src={outputDataUrl}
						alt="Converted"
						class="h-auto max-h-48 max-w-full self-start rounded-md border border-border object-contain"
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>
