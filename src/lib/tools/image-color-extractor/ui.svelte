<script lang="ts">
	import { Alert } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { imageColorExtractor, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let colors = $state<{ hex: string; count: number; percent: number }[]>([]);
	let processing = $state(false);

	const hexList = $derived(colors.map((c) => c.hex).join('\n'));

	async function extractColors() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			const out = await run({ dataUrl: sourceDataUrl, maxColors: 6 });
			colors = out.colors;
		} catch (err) {
			colors = [];
			error = err instanceof Error ? err.message : 'Failed to extract colors';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		sourceDataUrl = await readFileAsDataUrl(file);
		colors = [];
		await extractColors();
	}

	$effect(() => {
		setToolShellActions({
			copyValue: hexList,
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				colors = [];
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={imageColorExtractor.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			colors = [];
		}}
	/>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<img
			src={sourceDataUrl}
			alt="Uploaded preview"
			class="max-h-48 w-auto rounded-md border border-border"
		/>
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Extracting colors…</p>
	{:else if colors.length}
		<div class="flex flex-wrap gap-3">
			{#each colors as color (color.hex)}
				<div class="flex min-w-28 flex-col gap-1 rounded-md border border-border p-2">
					<div
						class="h-12 rounded-md border border-border"
						style={`background:${color.hex}`}
						aria-hidden="true"
					></div>
					<p class="font-mono text-sm">{color.hex}</p>
					<p class="text-xs text-muted">{color.percent}%</p>
				</div>
			{/each}
		</div>

		<div class="flex flex-wrap items-center gap-2"></div>
	{/if}
</div>
