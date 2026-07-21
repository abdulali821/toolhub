<script lang="ts">
	import { Alert, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { pdfExtractPages, run } from './index';

	let error = $state<string | null>(null);
	let sourceBytes = $state<Uint8Array | null>(null);
	let sourceName = $state('');
	let pagesSpec = $state('1');
	let outputBytes = $state<Uint8Array | null>(null);
	let pageCount = $state(0);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function process() {
		if (!sourceBytes || !pagesSpec.trim()) {
			outputBytes = null;
			return;
		}
		processing = true;
		error = null;
		try {
			const out = await run({ pdf: sourceBytes, pagesSpec });
			outputBytes = out.pdfBytes;
			pageCount = out.pageCount;
		} catch (err) {
			outputBytes = null;
			error = err instanceof Error ? err.message : 'Failed to extract pages';
		} finally {
			processing = false;
		}
	}

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, pdfExtractPages.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		sourceName = file.name.replace(/\.pdf$/i, '');
		sourceBytes = new Uint8Array(await file.arrayBuffer());
		outputBytes = null;
		await process();
	}

	let downloadDataUrl = $derived(outputBytes ? pdfBytesToDataUrl(outputBytes) : '');

	$effect(() => {
		void pagesSpec;
		if (sourceBytes) void process();
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: downloadDataUrl,
			downloadFilename: `${sourceName || 'document'}-extracted.pdf`,
			downloadMime: 'application/pdf',
			onReset: () => {
				error = null;
				sourceBytes = null;
				sourceName = '';
				pagesSpec = '1';
				outputBytes = null;
				pageCount = 0;
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
		accept={pdfExtractPages.file!.accept}
		aria-label="Upload PDF"
		onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if !sourceBytes}
		<p class="text-sm text-muted">Upload a PDF, then choose which pages to extract.</p>
	{/if}

	{#if sourceBytes}
		<Field id="pdf-extract-pages-spec" label="Pages to extract" hint="Example: 1,3-5" required>
			<input
				id="pdf-extract-pages-spec"
				type="text"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={pagesSpec}
				placeholder="1,3-5"
				aria-label="Pages to extract"
				required
			/>
		</Field>
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Extracting…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if outputBytes && !processing}
		<Alert variant="success" title="Ready">
			Extracted {pageCount} page{pageCount === 1 ? '' : 's'} into a new PDF.
		</Alert>
	{/if}
</div>
