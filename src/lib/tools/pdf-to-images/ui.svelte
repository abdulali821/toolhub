<script lang="ts">
	import { Alert, Button, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { validateFile } from '$lib/utils/file';
	import { pdfToImages, resolvePageNumbers } from './index';
	import { getPdfPageCount, renderPdfPages, type RenderedPage } from './render';

	let error = $state<string | null>(null);
	let sourceBytes = $state<Uint8Array | null>(null);
	let sourceName = $state('');
	let pagesSpec = $state('');
	let totalPages = $state(0);
	let rendered = $state<RenderedPage[]>([]);
	let selectedIndex = $state(0);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function render() {
		if (!sourceBytes) return;
		processing = true;
		error = null;
		try {
			const pageNumbers = resolvePageNumbers(
				{ pdf: sourceBytes, pagesSpec: pagesSpec || undefined },
				totalPages
			).pageNumbers;
			rendered = await renderPdfPages(sourceBytes, pageNumbers);
			selectedIndex = 0;
		} catch (err) {
			rendered = [];
			error = err instanceof Error ? err.message : 'Failed to render PDF pages';
		} finally {
			processing = false;
		}
	}

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, pdfToImages.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		sourceName = file.name.replace(/\.pdf$/i, '');
		const bytes = new Uint8Array(await file.arrayBuffer());
		sourceBytes = bytes;
		rendered = [];
		try {
			totalPages = await getPdfPageCount(bytes);
			await render();
		} catch (err) {
			totalPages = 0;
			error = err instanceof Error ? err.message : 'Failed to read PDF';
		}
	}

	function downloadPage(page: RenderedPage) {
		const anchor = document.createElement('a');
		anchor.href = page.dataUrl;
		anchor.download = `${sourceName || 'page'}-${page.pageNumber}.png`;
		anchor.click();
	}

	let selectedPage = $derived(rendered[selectedIndex] ?? null);

	$effect(() => {
		void pagesSpec;
		if (sourceBytes && totalPages) void render();
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: selectedPage?.dataUrl ?? '',
			downloadFilename: selectedPage
				? `${sourceName || 'page'}-${selectedPage.pageNumber}.png`
				: 'page.png',
			downloadMime: 'image/png',
			onReset: () => {
				error = null;
				sourceBytes = null;
				sourceName = '';
				pagesSpec = '';
				totalPages = 0;
				rendered = [];
				selectedIndex = 0;
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
		accept={pdfToImages.file!.accept}
		aria-label="Upload PDF to convert to images"
		onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if !sourceBytes}
		<p class="text-sm text-muted">Upload a PDF to export pages as PNG images.</p>
	{/if}

	{#if sourceBytes && totalPages}
		<p class="text-sm text-muted">
			{totalPages} page{totalPages === 1 ? '' : 's'} detected. Leave pages blank to render all.
		</p>

		<Field id="pdf-to-images-pages" label="Pages to render" hint="Example: 1,3-5 (optional)">
			<input
				id="pdf-to-images-pages"
				type="text"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={pagesSpec}
				placeholder="All pages"
				aria-label="Pages to render"
			/>
		</Field>
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Rendering pages…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if rendered.length && !processing}
		<Alert variant="success" title="Ready">
			Rendered {rendered.length} page{rendered.length === 1 ? '' : 's'}. Select a thumbnail — the
			action bar downloads that page as PNG.
		</Alert>

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each rendered as page, index (page.pageNumber)}
				<div
					role="button"
					tabindex="0"
					class="cursor-pointer rounded-md border p-2 text-left transition-colors {selectedIndex ===
					index
						? 'border-accent bg-bg-elevated'
						: 'border-border hover:border-accent/50'}"
					onclick={() => {
						selectedIndex = index;
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							selectedIndex = index;
						}
					}}
					aria-label="Select page {page.pageNumber}"
					aria-pressed={selectedIndex === index}
				>
					<img
						src={page.dataUrl}
						alt="Page {page.pageNumber}"
						class="mb-2 max-h-32 w-full rounded object-contain"
					/>
					<div class="flex items-center justify-between gap-2 text-xs">
						<span>Page {page.pageNumber}</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={(e) => {
								e.stopPropagation();
								downloadPage(page);
							}}
						>
							Download
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
