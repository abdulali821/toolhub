<script lang="ts">
	import { Alert, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { pdfDeletePages, run } from './index';

	let error = $state<string | null>(null);
	let sourceBytes = $state<Uint8Array | null>(null);
	let sourceName = $state('');
	let pagesSpec = $state('');
	let outputBytes = $state<Uint8Array | null>(null);
	let pageCount = $state(0);
	let removed = $state(0);
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
			removed = out.removed;
		} catch (err) {
			outputBytes = null;
			error = err instanceof Error ? err.message : 'Failed to delete pages';
		} finally {
			processing = false;
		}
	}

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, pdfDeletePages.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		sourceName = file.name.replace(/\.pdf$/i, '');
		sourceBytes = new Uint8Array(await file.arrayBuffer());
		outputBytes = null;
		if (pagesSpec.trim()) await process();
	}

	let downloadDataUrl = $derived(outputBytes ? pdfBytesToDataUrl(outputBytes) : '');

	$effect(() => {
		void pagesSpec;
		if (sourceBytes) void process();
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: downloadDataUrl,
			downloadFilename: `${sourceName || 'document'}-trimmed.pdf`,
			downloadMime: 'application/pdf',
			onReset: () => {
				error = null;
				sourceBytes = null;
				sourceName = '';
				pagesSpec = '';
				outputBytes = null;
				pageCount = 0;
				removed = 0;
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
		accept={pdfDeletePages.file!.accept}
		aria-label="Upload PDF"
		onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if !sourceBytes}
		<p class="text-sm text-muted">Upload a PDF, then enter the pages you want to remove.</p>
	{/if}

	{#if sourceBytes}
		<Field id="pdf-delete-pages-spec" label="Pages to delete" hint="Example: 2,4-6" required>
			<input
				id="pdf-delete-pages-spec"
				type="text"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={pagesSpec}
				placeholder="2,4-6"
				aria-label="Pages to delete"
				required
			/>
		</Field>
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Removing pages…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if outputBytes && !processing}
		<Alert variant="success" title="Ready">
			Removed {removed} page{removed === 1 ? '' : 's'}. {pageCount} page{pageCount === 1 ? '' : 's'} remain.
		</Alert>
	{/if}
</div>
