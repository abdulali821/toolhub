<script lang="ts">
	import { Alert, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { formatBytes } from '$lib/utils/bytes';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { PDFDocument } from 'pdf-lib';
	import { renderPdfPages } from '../pdf-to-images/render';
	import { pdfCompress, run } from './index';

	type Mode = 'structure' | 'balanced' | 'strong';

	let error = $state<string | null>(null);
	let sourceBytes = $state<Uint8Array | null>(null);
	let sourceName = $state('');
	let outputBytes = $state<Uint8Array | null>(null);
	let originalBytes = $state(0);
	let compressedBytes = $state(0);
	let pageCount = $state(0);
	let mode = $state<Mode>('balanced');
	let quality = $state(0.72);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function rasterizeStrong(input: {
		bytes: Uint8Array;
		quality: number;
		scale: number;
	}): Promise<Uint8Array> {
		const src = await PDFDocument.load(input.bytes);
		const count = src.getPageCount();
		const pages = await renderPdfPages(
			input.bytes,
			Array.from({ length: count }, (_, i) => i + 1),
			input.scale,
			'image/jpeg',
			input.quality
		);

		const out = await PDFDocument.create();
		for (const page of pages) {
			const jpgBytes = dataUrlToBytes(page.dataUrl);
			const image = await out.embedJpg(jpgBytes);
			const pdfPage = out.addPage([page.width, page.height]);
			pdfPage.drawImage(image, {
				x: 0,
				y: 0,
				width: page.width,
				height: page.height
			});
		}
		return out.save({ useObjectStreams: true });
	}

	function dataUrlToBytes(dataUrl: string): Uint8Array {
		const base64 = dataUrl.split(',')[1] ?? '';
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return bytes;
	}

	async function compress() {
		if (!sourceBytes) return;
		processing = true;
		error = null;
		try {
			const out = await run(
				{ pdf: sourceBytes, mode, quality: Number(quality) },
				mode === 'strong' ? rasterizeStrong : undefined
			);
			outputBytes = out.pdfBytes;
			originalBytes = out.originalBytes;
			compressedBytes = out.compressedBytes;
			pageCount = out.pageCount;
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
				mode = 'balanced';
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

	{#if !sourceBytes}
		<p class="text-sm text-muted">Upload a PDF, then choose how aggressively to compress it.</p>
	{/if}

	{#if sourceBytes}
		<Field id="pc-mode" label="Compression mode">
			<select
				id="pc-mode"
				class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
				bind:value={mode}
			>
				<option value="structure">Structure — rewrite object streams (lossless layout)</option>
				<option value="balanced">Balanced — structure + leaner metadata (default)</option>
				<option value="strong">Strong — rasterize pages to JPEG (best for scans)</option>
			</select>
		</Field>

		{#if mode === 'strong'}
			<Field id="pc-quality" label="JPEG quality" hint="Lower = smaller file, more artifacts">
				<input
					id="pc-quality"
					type="range"
					min="0.4"
					max="0.92"
					step="0.02"
					bind:value={quality}
					class="w-full"
				/>
				<p class="mt-1 text-sm text-muted">{Number(quality).toFixed(2)}</p>
			</Field>
			<Alert variant="warning" title="Strong mode note">
				Pages become images. Text will no longer be selectable or searchable.
			</Alert>
		{/if}
	{/if}

	{#if processing}
		<p class="text-sm text-muted">
			{mode === 'strong' ? 'Rasterizing and rebuilding…' : 'Compressing…'}
		</p>
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
				({Math.abs(savings)}% larger — try Strong mode for scans)
			{:else}
				(no change)
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
