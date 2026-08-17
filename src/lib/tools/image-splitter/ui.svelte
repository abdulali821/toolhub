<script lang="ts">
	import { Alert, Button, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import {
		imageSplitter,
		run,
		type SplitDirection,
		type SplitMeasure,
		type SplitOutputFormat
	} from './index';

	const DEFAULT_VERTICAL_COUNT = 3;
	const DEFAULT_HORIZONTAL_COUNT = 3;
	const DEFAULT_BLOCK_SIZE = 512;
	const DEFAULT_QUALITY = 0.92;

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let fileName = $state('image');
	let direction = $state<SplitDirection>('grid');
	let verticalMeasure = $state<SplitMeasure>('count');
	let verticalCount = $state(DEFAULT_VERTICAL_COUNT);
	let verticalSize = $state(DEFAULT_BLOCK_SIZE);
	let verticalOverlap = $state(0);
	let horizontalMeasure = $state<SplitMeasure>('count');
	let horizontalCount = $state(DEFAULT_HORIZONTAL_COUNT);
	let horizontalSize = $state(DEFAULT_BLOCK_SIZE);
	let horizontalOverlap = $state(0);
	let outputFormat = $state<SplitOutputFormat>('same');
	let quality = $state(DEFAULT_QUALITY);
	let processing = $state(false);
	let zipBusy = $state(false);
	let result = $state<Awaited<ReturnType<typeof run>> | null>(null);

	const showVertical = $derived(direction === 'vertical' || direction === 'grid');
	const showHorizontal = $derived(direction === 'horizontal' || direction === 'grid');

	async function process() {
		if (!sourceDataUrl) return;
		processing = true;
		error = null;
		try {
			result = await run({
				dataUrl: sourceDataUrl,
				direction,
				vertical: {
					measure: verticalMeasure,
					count: Math.round(Number(verticalCount)),
					size: Math.round(Number(verticalSize)),
					overlap: Math.round(Number(verticalOverlap))
				},
				horizontal: {
					measure: horizontalMeasure,
					count: Math.round(Number(horizontalCount)),
					size: Math.round(Number(horizontalSize)),
					overlap: Math.round(Number(horizontalOverlap))
				},
				outputFormat,
				quality: Number(quality)
			});
		} catch (err) {
			result = null;
			error = err instanceof Error ? err.message : 'Failed to split image';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
		sourceDataUrl = await readFileAsDataUrl(file);
		await process();
	}

	function downloadDataUrl(dataUrl: string, name: string) {
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = name;
		a.click();
	}

	async function downloadZip() {
		if (!result?.pieces.length || zipBusy) return;
		zipBusy = true;
		error = null;
		try {
			const JSZip = (await import('jszip')).default;
			const zip = new JSZip();
			for (const piece of result.pieces) {
				const comma = piece.dataUrl.indexOf(',');
				const b64 = piece.dataUrl.slice(comma + 1);
				zip.file(piece.name, b64, { base64: true });
			}
			const blob = await zip.generateAsync({ type: 'blob' });
			const href = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = href;
			a.download = `${fileName}-split.zip`;
			a.click();
			URL.revokeObjectURL(href);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create ZIP';
		} finally {
			zipBusy = false;
		}
	}

	function resetAll() {
		error = null;
		sourceDataUrl = '';
		fileName = 'image';
		direction = 'grid';
		verticalMeasure = 'count';
		verticalCount = DEFAULT_VERTICAL_COUNT;
		verticalSize = DEFAULT_BLOCK_SIZE;
		verticalOverlap = 0;
		horizontalMeasure = 'count';
		horizontalCount = DEFAULT_HORIZONTAL_COUNT;
		horizontalSize = DEFAULT_BLOCK_SIZE;
		horizontalOverlap = 0;
		outputFormat = 'same';
		quality = DEFAULT_QUALITY;
		result = null;
	}

	$effect(() => {
		void direction;
		void verticalMeasure;
		void verticalCount;
		void verticalSize;
		void verticalOverlap;
		void horizontalMeasure;
		void horizontalCount;
		void horizontalSize;
		void horizontalOverlap;
		void outputFormat;
		void quality;
		if (sourceDataUrl) void process();
	});

	$effect(() => {
		const first = result?.pieces[0];
		setToolShellActions({
			downloadValue: first?.dataUrl ?? '',
			downloadFilename: first?.name ?? `${fileName}-split.png`,
			downloadMime: first?.dataUrl.match(/^data:([^;,]+)/)?.[1] ?? 'image/png',
			onReset: resetAll
		});
	});
</script>

<div class="flex max-w-3xl flex-col gap-4">
	<Dropzone
		constraints={imageSplitter.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		disabled={processing}
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			result = null;
		}}
	/>

	<p class="text-sm text-muted">
		Split vertically, horizontally, or into a grid—equal blocks or fixed pixel size, with optional
		overlap between pieces. Everything stays in your browser.
	</p>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<Field id="is-direction" label="Split direction">
			<select
				id="is-direction"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={direction}
				disabled={processing}
			>
				<option value="vertical">Vertical (rows)</option>
				<option value="horizontal">Horizontal (columns)</option>
				<option value="grid">Grid (rows and columns)</option>
			</select>
		</Field>

		<div class="grid gap-4 sm:grid-cols-2">
			{#if showVertical}
				<div class="rounded-md border border-border p-3">
					<p class="mb-2 text-sm font-medium">Vertical (height)</p>
					<Field id="is-v-measure" label="Split by">
						<select
							id="is-v-measure"
							class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
							bind:value={verticalMeasure}
							disabled={processing}
						>
							<option value="count">Quantity of rows (equal height)</option>
							<option value="size">Fixed row height (px)</option>
						</select>
					</Field>
					{#if verticalMeasure === 'count'}
						<Field id="is-v-count" label="Rows ({Math.round(Number(verticalCount))})">
							<input
								id="is-v-count"
								type="range"
								min="1"
								max="20"
								step="1"
								bind:value={verticalCount}
								disabled={processing}
								class="w-full accent-fg"
							/>
						</Field>
					{:else}
						<Field id="is-v-size" label="Row height ({Math.round(Number(verticalSize))}px)">
							<input
								id="is-v-size"
								type="number"
								min="1"
								max="10000"
								bind:value={verticalSize}
								disabled={processing}
								class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
							/>
						</Field>
					{/if}
					<Field id="is-v-overlap" label="Row overlap ({Math.round(Number(verticalOverlap))}px)">
						<input
							id="is-v-overlap"
							type="range"
							min="0"
							max="120"
							step="1"
							bind:value={verticalOverlap}
							disabled={processing}
							class="w-full accent-fg"
						/>
					</Field>
				</div>
			{/if}

			{#if showHorizontal}
				<div class="rounded-md border border-border p-3">
					<p class="mb-2 text-sm font-medium">Horizontal (width)</p>
					<Field id="is-h-measure" label="Split by">
						<select
							id="is-h-measure"
							class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
							bind:value={horizontalMeasure}
							disabled={processing}
						>
							<option value="count">Quantity of columns (equal width)</option>
							<option value="size">Fixed column width (px)</option>
						</select>
					</Field>
					{#if horizontalMeasure === 'count'}
						<Field id="is-h-count" label="Columns ({Math.round(Number(horizontalCount))})">
							<input
								id="is-h-count"
								type="range"
								min="1"
								max="20"
								step="1"
								bind:value={horizontalCount}
								disabled={processing}
								class="w-full accent-fg"
							/>
						</Field>
					{:else}
						<Field id="is-h-size" label="Column width ({Math.round(Number(horizontalSize))}px)">
							<input
								id="is-h-size"
								type="number"
								min="1"
								max="10000"
								bind:value={horizontalSize}
								disabled={processing}
								class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
							/>
						</Field>
					{/if}
					<Field
						id="is-h-overlap"
						label="Column overlap ({Math.round(Number(horizontalOverlap))}px)"
					>
						<input
							id="is-h-overlap"
							type="range"
							min="0"
							max="120"
							step="1"
							bind:value={horizontalOverlap}
							disabled={processing}
							class="w-full accent-fg"
						/>
					</Field>
				</div>
			{/if}
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<Field id="is-format" label="Output format">
				<select
					id="is-format"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={outputFormat}
					disabled={processing}
				>
					<option value="same">Same as input</option>
					<option value="image/png">PNG</option>
					<option value="image/jpeg">JPEG</option>
					<option value="image/webp">WebP</option>
				</select>
			</Field>
			{#if outputFormat === 'image/jpeg' || outputFormat === 'image/webp'}
				<Field id="is-quality" label="Quality ({Math.round(Number(quality) * 100)}%)">
					<input
						id="is-quality"
						type="range"
						min="0.5"
						max="1"
						step="0.01"
						bind:value={quality}
						disabled={processing}
						class="w-full accent-fg"
					/>
				</Field>
			{/if}
		</div>

		{#if processing}
			<p class="text-sm text-muted">Splitting image…</p>
		{:else if result}
			<div class="flex flex-wrap items-center gap-2">
				<p class="text-sm text-fg">
					{result.pieces.length} piece{result.pieces.length === 1 ? '' : 's'} · {result.cols}×{result.rows}
					grid · {result.sourceWidth}×{result.sourceHeight}px source
				</p>
				<Button
					type="button"
					size="sm"
					variant="secondary"
					disabled={zipBusy}
					onclick={downloadZip}
				>
					{zipBusy ? 'Zipping…' : 'Download all (ZIP)'}
				</Button>
			</div>

			<div
				class="grid gap-2"
				style={`grid-template-columns: repeat(${Math.min(result.cols, 6)}, minmax(0, 1fr));`}
			>
				{#each result.pieces as piece (piece.index)}
					<div class="rounded-md border border-border p-2">
						<img
							src={piece.dataUrl}
							alt={piece.name}
							class="mb-2 block h-auto max-h-32 w-full object-contain"
						/>
						<p class="truncate text-xs text-muted">{piece.name}</p>
						<p class="text-xs text-muted">{piece.width}×{piece.height}px</p>
						<button
							type="button"
							class="mt-1 text-xs font-medium text-fg underline-offset-2 hover:underline"
							onclick={() => downloadDataUrl(piece.dataUrl, piece.name)}>Download</button
						>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<p class="text-sm text-muted">
			Great for Instagram grids, puzzle pieces, or chopping a large texture into tiles—similar to
			<a
				class="text-fg underline-offset-2 hover:underline"
				href="https://pinetools.com/split-image"
				target="_blank"
				rel="noopener noreferrer">PineTools split image</a
			>, but private and in-browser.
		</p>
	{/if}
</div>
