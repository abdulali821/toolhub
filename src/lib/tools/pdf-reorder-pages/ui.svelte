<script lang="ts">
	import { Alert, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { PDFDocument } from 'pdf-lib';
	import { pdfReorderPages, run } from './index';

	let error = $state<string | null>(null);
	let sourceBytes = $state<Uint8Array | null>(null);
	let sourceName = $state('');
	let orderSpec = $state('');
	let totalPages = $state(0);
	let outputBytes = $state<Uint8Array | null>(null);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function loadPageCount(bytes: Uint8Array) {
		const doc = await PDFDocument.load(bytes);
		totalPages = doc.getPageCount();
		orderSpec = totalPages > 0 ? Array.from({ length: totalPages }, (_, i) => i + 1).join(',') : '';
	}

	async function process() {
		if (!sourceBytes || !orderSpec.trim()) {
			outputBytes = null;
			return;
		}
		processing = true;
		error = null;
		try {
			const out = await run({ pdf: sourceBytes, orderSpec });
			outputBytes = out.pdfBytes;
		} catch (err) {
			outputBytes = null;
			error = err instanceof Error ? err.message : 'Failed to reorder pages';
		} finally {
			processing = false;
		}
	}

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, pdfReorderPages.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		sourceName = file.name.replace(/\.pdf$/i, '');
		const bytes = new Uint8Array(await file.arrayBuffer());
		sourceBytes = bytes;
		outputBytes = null;
		try {
			await loadPageCount(bytes);
			await process();
		} catch (err) {
			totalPages = 0;
			error = err instanceof Error ? err.message : 'Failed to read PDF';
		}
	}

	let downloadDataUrl = $derived(outputBytes ? pdfBytesToDataUrl(outputBytes) : '');

	$effect(() => {
		void orderSpec;
		if (sourceBytes) void process();
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: downloadDataUrl,
			downloadFilename: `${sourceName || 'document'}-reordered.pdf`,
			downloadMime: 'application/pdf',
			onReset: () => {
				error = null;
				sourceBytes = null;
				sourceName = '';
				orderSpec = '';
				totalPages = 0;
				outputBytes = null;
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
		accept={pdfReorderPages.file!.accept}
		aria-label="Upload PDF"
		onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if !sourceBytes}
		<p class="text-sm text-muted">Upload a PDF to reorder its pages.</p>
	{/if}

	{#if sourceBytes && totalPages}
		<p class="text-sm text-muted">
			This PDF has {totalPages} page{totalPages === 1 ? '' : 's'}. List every page once in the new
			order.
		</p>

		<Field id="pdf-reorder-order" label="New page order" hint="Example: 3,1,2" required>
			<input
				id="pdf-reorder-order"
				type="text"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={orderSpec}
				placeholder="3,1,2"
				aria-label="New page order"
				required
			/>
		</Field>
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Reordering…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if outputBytes && !processing}
		<Alert variant="success" title="Ready">
			Pages reordered. Download the updated {totalPages}-page PDF.
		</Alert>
	{/if}
</div>
