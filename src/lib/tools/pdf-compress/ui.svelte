<script lang="ts">
	import { Alert, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { formatBytes } from '$lib/utils/bytes';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { PDFDocument } from 'pdf-lib';
	import { adaptiveRasterScale, rasterizePdfToJpeg } from './raster';
	import { recompressEmbeddedImages } from '$lib/utils/pdf-image-compress';
	import { pdfCompress, run, type CompressMode } from './index';

	let error = $state<string | null>(null);
	let sourceBytes = $state<Uint8Array | null>(null);
	let sourceName = $state('');
	let outputBytes = $state<Uint8Array | null>(null);
	let originalBytes = $state(0);
	let compressedBytes = $state(0);
	let pageCount = $state(0);
	let technique = $state<'rewrite' | 'raster' | 'images'>('rewrite');
	let imagesReplaced = $state(0);
	let imagesScanned = $state(0);
	let mode = $state<CompressMode>('recommended');
	let quality = $state(0.72);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	const levels: { value: CompressMode; title: string; hint: string }[] = [
		{
			value: 'recommended',
			title: 'Recommended',
			hint: 'Good balance of size and quality'
		},
		{
			value: 'high',
			title: 'Less compression',
			hint: 'Higher quality, larger file'
		},
		{
			value: 'extreme',
			title: 'Extreme',
			hint: 'Smallest file — best for scans and photos'
		}
	];

	async function rasterize(input: {
		bytes: Uint8Array;
		quality: number;
		scale: number;
	}): Promise<Uint8Array> {
		const src = await PDFDocument.load(input.bytes);
		const { width } = src.getPage(0).getSize();
		const scale = adaptiveRasterScale(width, input.scale);
		return rasterizePdfToJpeg(input.bytes, input.quality, scale);
	}

	async function compress() {
		if (!sourceBytes) return;
		processing = true;
		error = null;
		try {
			const out = await run(
				{ pdf: sourceBytes, mode, quality: Number(quality) },
				mode === 'extreme' ? { rasterize } : { recompressImages: recompressEmbeddedImages }
			);
			outputBytes = out.pdfBytes;
			originalBytes = out.originalBytes;
			compressedBytes = out.compressedBytes;
			pageCount = out.pageCount;
			technique = out.technique;
			imagesReplaced = out.imagesReplaced;
			imagesScanned = out.imagesScanned;
		} catch (err) {
			outputBytes = null;
			error = err instanceof Error ? err.message : 'Failed to compress PDF';
		} finally {
			processing = false;
		}
	}

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, pdfCompress.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		sourceName = file.name.replace(/\.pdf$/i, '');
		sourceBytes = new Uint8Array(await file.arrayBuffer());
		outputBytes = null;
	}

	let savings = $derived(
		originalBytes > 0 ? Math.round((1 - compressedBytes / originalBytes) * 100) : 0
	);
	let downloadDataUrl = $derived(outputBytes ? pdfBytesToDataUrl(outputBytes) : '');

	$effect(() => {
		if (!sourceBytes) return;
		void [mode, quality];
		void compress();
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: downloadDataUrl,
			downloadFilename: `${sourceName || 'document'}-compressed.pdf`,
			downloadMime: 'application/pdf',
			onReset: () => {
				error = null;
				sourceBytes = null;
				sourceName = '';
				outputBytes = null;
				originalBytes = 0;
				compressedBytes = 0;
				pageCount = 0;
				technique = 'rewrite';
				imagesReplaced = 0;
				imagesScanned = 0;
				mode = 'recommended';
				quality = 0.72;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<div
		role="button"
		tabindex="0"
		class="cursor-pointer rounded-lg border border-dashed border-border bg-bg-elevated px-4 py-8 text-center"
		onclick={() => inputEl?.click()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				inputEl?.click();
			}
		}}
	>
		<p class="font-medium text-fg">Choose a PDF</p>
		<p class="mt-1 text-sm text-muted">One file, up to 10 MB</p>
	</div>

	<input
		bind:this={inputEl}
		type="file"
		class="sr-only"
		accept={pdfCompress.file!.accept}
		aria-label="Upload PDF to compress"
		onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if sourceBytes}
		<Field id="pc-mode" label="Compression level">
			<div class="flex flex-col gap-2" role="radiogroup" aria-labelledby="pc-mode">
				{#each levels as level (level.value)}
					<label
						class="flex cursor-pointer gap-3 rounded-md border px-3 py-3 transition-colors {mode ===
						level.value
							? 'border-fg bg-bg-elevated'
							: 'border-border hover:border-fg/40'}"
					>
						<input
							type="radio"
							name="pc-mode"
							value={level.value}
							bind:group={mode}
							class="mt-1 accent-fg"
						/>
						<span class="min-w-0">
							<span class="block font-medium text-fg">{level.title}</span>
							<span class="mt-0.5 block text-sm text-muted">{level.hint}</span>
						</span>
					</label>
				{/each}
			</div>
		</Field>

		{#if mode === 'extreme'}
			<Field id="pc-quality" label="JPEG quality" hint="Lower = smaller file, more artifacts">
				<input
					id="pc-quality"
					type="range"
					min="0.4"
					max="0.92"
					step="0.02"
					bind:value={quality}
					class="w-full accent-fg"
				/>
				<p class="mt-1 text-sm text-muted">{Number(quality).toFixed(2)}</p>
			</Field>
			<Alert variant="warning" title="Heads up">
				This mode makes each page an image. Use Recommended if you need to copy text from the PDF.
			</Alert>
		{:else if mode === 'high'}
			<p class="text-sm text-muted">Keeps more detail. File may not shrink as much.</p>
		{/if}
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Compressing…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if outputBytes && !processing}
		<Alert variant="success" title="Ready">
			{pageCount} page{pageCount === 1 ? '' : 's'} · {formatBytes(originalBytes)} → {formatBytes(
				compressedBytes
			)}
			{#if savings > 0}
				({savings}% smaller)
			{:else if savings < 0}
				({Math.abs(savings)}% larger — try lower JPEG quality in Extreme mode)
			{:else}
				(no change)
			{/if}
			{#if technique === 'raster'}
				<span class="mt-1 block text-sm">Saved as image pages.</span>
			{:else if imagesScanned === 0 && savings === 0}
				<span class="mt-1 block text-sm">Try Extreme mode if you need a smaller file.</span>
			{:else if technique === 'images' && imagesReplaced > 0}
				<span class="mt-1 block text-sm"
					>Optimized {imagesReplaced} image{imagesReplaced === 1 ? '' : 's'}.</span
				>
			{/if}
		</Alert>

		<dl class="grid gap-2 rounded-md border border-border px-4 py-3 text-sm sm:grid-cols-2">
			<div>
				<dt class="text-muted">Original</dt>
				<dd class="font-medium">{formatBytes(originalBytes)}</dd>
			</div>
			<div>
				<dt class="text-muted">Compressed</dt>
				<dd class="font-medium">{formatBytes(compressedBytes)}</dd>
			</div>
		</dl>
	{/if}
</div>
