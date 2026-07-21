<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Field, Textarea } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { readFileAsText } from '$lib/utils/file';
	import { svgOptimizer, run } from './index';

	const shareKeys = svgOptimizer.share!.params;
	const maxParamBytes = svgOptimizer.share!.maxParamBytes;
	const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <!-- decorative icon -->
  <rect x="0" y="0" width="100" height="100" fill="#2563eb"/>
</svg>`;

	function stateFromUrl() {
		return {
			source: readShareParam(page.url.searchParams, 'source') ?? DEFAULT_SVG
		};
	}

	const initial = stateFromUrl();
	let source = $state(initial.source);
	let fileName = $state('optimized');
	let result = $derived(source.trim() ? run({ source }) : null);

	$effect(() => {
		const next = stateFromUrl();
		untrack(() => {
			if (next.source !== source) source = next.source;
		});
	});

	$effect(() => {
		syncShareParams({ source }, shareKeys, {
			maxParamBytes,
			defaults: { source: DEFAULT_SVG }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result?.svg ?? '',
			downloadValue: result?.svg ?? '',
			downloadFilename: `${fileName}.svg`,
			downloadMime: 'image/svg+xml;charset=utf-8',
			onReset: () => {
				source = DEFAULT_SVG;
				fileName = 'optimized';
			}
		});
	});

	async function onselect(file: File) {
		source = await readFileAsText(file);
		fileName = file.name.replace(/\.svg$/i, '') || 'optimized';
	}
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<div class="flex flex-col gap-4">
		<Dropzone
			constraints={svgOptimizer.file!}
			label="Upload SVG file"
			hint="SVG up to 1 MB"
			{onselect}
		/>

		<Field id="svg-source" label="SVG source" required>
			<Textarea
				id="svg-source"
				bind:value={source}
				rows={14}
				class="font-mono text-sm"
				spellcheck="false"
			/>
		</Field>
	</div>

	<div class="flex flex-col gap-3">
		{#if result}
			<Alert variant="success" title="Optimized">
				{result.originalBytes} bytes → {result.optimizedBytes} bytes ({result.originalBytes -
					result.optimizedBytes} saved)
			</Alert>
		{/if}

		<Field id="svg-output" label="Optimized SVG">
			<Textarea
				id="svg-output"
				value={result?.svg ?? ''}
				rows={14}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
