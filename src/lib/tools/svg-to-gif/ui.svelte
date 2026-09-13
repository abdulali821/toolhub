<script lang="ts">
	import { Alert, Button, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { downloadText } from '$engine/share-state';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { run, svgToGif } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let outputBlobUrl = $state('');
	let fileName = $state('graphic');
	let width = $state(480);
	let frames = $state(8);
	let pulse = $state(true);
	let processing = $state(false);

	function revokeBlob() {
		if (outputBlobUrl.startsWith('blob:')) URL.revokeObjectURL(outputBlobUrl);
		outputBlobUrl = '';
	}

	function clearOutput() {
		outputDataUrl = '';
		revokeBlob();
	}

	async function processSvg() {
		if (!sourceDataUrl || processing) return;
		processing = true;
		error = null;
		clearOutput();
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				width: Number(width),
				frames: Number(frames),
				pulse
			});
			outputDataUrl = out.dataUrl;
			outputBlobUrl = out.blobUrl;
		} catch (err) {
			clearOutput();
			error = err instanceof Error ? err.message : 'Failed to convert SVG';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.svg$/i, '') || 'graphic';
		sourceDataUrl = await readFileAsDataUrl(file);
		clearOutput();
	}

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputBlobUrl || outputDataUrl,
			downloadFilename: `${fileName}.gif`,
			downloadMime: 'image/gif',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				clearOutput();
				fileName = 'graphic';
				width = 480;
				frames = 8;
				pulse = true;
			}
		});
	});
</script>

<div class="flex w-full max-w-5xl flex-col gap-8">
	<section class="flex flex-col gap-3">
		<div>
			<p class="text-sm font-medium text-fg">1. Upload SVG</p>
			<p class="text-sm text-muted">
				Load the vector first — then set size and frames before generating.
			</p>
		</div>
		<Dropzone
			constraints={svgToGif.file!}
			class="rounded-xl px-6 py-16"
			label="Drop an SVG here or browse"
			hint="SVG only · up to 1 MB"
			{onselect}
			onerror={(message) => {
				error = message;
				sourceDataUrl = '';
				clearOutput();
			}}
		/>
	</section>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<section class="flex flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
			<div>
				<p class="text-sm font-medium text-fg">2. Settings</p>
				<p class="text-sm text-muted">
					Adjust options, then Generate — nothing encodes until you click.
				</p>
			</div>

			<div class="grid gap-6 sm:grid-cols-2">
				<Field id="s2g-width" label="Width — {width}px">
					<input
						id="s2g-width"
						type="range"
						min="64"
						max="900"
						step="16"
						bind:value={width}
						class="h-3 w-full accent-fg"
						disabled={processing}
						oninput={() => clearOutput()}
					/>
				</Field>
				<Field id="s2g-frames" label="Frames — {frames}">
					<input
						id="s2g-frames"
						type="range"
						min="1"
						max="24"
						step="1"
						bind:value={frames}
						class="h-3 w-full accent-fg"
						disabled={processing}
						oninput={() => clearOutput()}
					/>
				</Field>
			</div>

			<label class="flex items-center gap-3 text-sm">
				<input
					type="checkbox"
					class="size-5 accent-fg"
					bind:checked={pulse}
					disabled={processing || frames <= 1}
					onchange={() => clearOutput()}
				/>
				Pulse animation (gentle scale loop)
			</label>

			<div class="overflow-hidden rounded-lg border border-border bg-bg p-6">
				<img src={sourceDataUrl} alt="SVG source" class="mx-auto max-h-112 w-full object-contain" />
			</div>

			<Button
				type="button"
				size="lg"
				class="w-full font-semibold sm:w-auto sm:min-w-56"
				disabled={processing}
				onclick={() => void processSvg()}
			>
				{processing ? 'Generating…' : '3. Generate GIF'}
			</Button>

			{#if processing}
				<p class="text-sm text-muted">Encoding GIF…</p>
			{/if}
		</section>
	{/if}

	{#if outputBlobUrl || outputDataUrl}
		<section class="flex flex-col gap-4">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p class="text-sm font-medium text-fg">GIF result</p>
					<p class="text-sm text-muted">Preview below, then download when it looks right.</p>
				</div>
				<Button
					type="button"
					size="lg"
					onclick={() =>
						downloadText(`${fileName}.gif`, outputBlobUrl || outputDataUrl, 'image/gif')}
				>
					Download GIF
				</Button>
			</div>
			<div class="overflow-hidden rounded-lg border border-border bg-bg p-4">
				<img
					src={outputBlobUrl || outputDataUrl}
					alt="GIF output"
					class="mx-auto max-h-112 w-full object-contain"
				/>
			</div>
		</section>
	{/if}
</div>
