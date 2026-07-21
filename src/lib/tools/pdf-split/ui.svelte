<script lang="ts">
	import { Alert, Button, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { pdfSplit, run } from './index';

	type SplitFile = { name: string; bytes: Uint8Array };

	let error = $state<string | null>(null);
	let sourceBytes = $state<Uint8Array | null>(null);
	let sourceName = $state('');
	let mode = $state<'all' | 'ranges'>('ranges');
	let ranges = $state('1');
	let pageCount = $state(0);
	let files = $state<SplitFile[]>([]);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function processPdf() {
		if (!sourceBytes) return;
		processing = true;
		error = null;
		try {
			const out = await run({
				pdf: sourceBytes,
				mode,
				ranges: mode === 'ranges' ? ranges : undefined
			});
			files = out.files;
			pageCount = out.pageCount;
		} catch (err) {
			files = [];
			pageCount = 0;
			error = err instanceof Error ? err.message : 'Failed to split PDF';
		} finally {
			processing = false;
		}
	}

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, pdfSplit.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		sourceName = file.name.replace(/\.pdf$/i, '');
		sourceBytes = new Uint8Array(await file.arrayBuffer());
		files = [];
		pageCount = 0;
		await processPdf();
	}

	function downloadFile(file: SplitFile) {
		const blob = new Blob([new Uint8Array(file.bytes)], { type: 'application/pdf' });
		const href = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = href;
		anchor.download = file.name;
		anchor.click();
		URL.revokeObjectURL(href);
	}

	let downloadDataUrl = $derived(files[0] ? pdfBytesToDataUrl(files[0].bytes) : '');

	$effect(() => {
		void [mode, ranges];
		if (sourceBytes) void processPdf();
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: downloadDataUrl,
			downloadFilename: files[0]?.name ?? `${sourceName || 'split'}.pdf`,
			downloadMime: 'application/pdf',
			onReset: () => {
				error = null;
				sourceBytes = null;
				sourceName = '';
				mode = 'ranges';
				ranges = '1';
				pageCount = 0;
				files = [];
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
		accept={pdfSplit.file!.accept}
		aria-label="Upload PDF to split"
		onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if !sourceBytes}
		<p class="text-sm text-muted">Upload a PDF to split it into pages or custom ranges.</p>
	{/if}

	{#if sourceBytes}
		<Field id="pdf-split-mode" label="Split mode">
			<select
				id="pdf-split-mode"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={mode}
				aria-label="Split mode"
			>
				<option value="ranges">Selected page ranges (one PDF)</option>
				<option value="all">Every page (separate files)</option>
			</select>
		</Field>

		{#if mode === 'ranges'}
			<Field id="pdf-split-ranges" label="Page ranges" hint="Example: 1,3-5,8">
				<input
					id="pdf-split-ranges"
					type="text"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={ranges}
					placeholder="1,3-5"
					aria-label="Page ranges"
				/>
			</Field>
		{/if}
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Splitting…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if files.length && !processing}
		<Alert variant="success" title="Ready">
			{#if mode === 'all'}
				Split {pageCount} page{pageCount === 1 ? '' : 's'} into {files.length} file{files.length ===
				1
					? ''
					: 's'}. Use the buttons below to download each page. The action bar downloads page 1.
			{:else}
				Extracted {files[0]?.name ?? 'split.pdf'} from {pageCount} page{pageCount === 1 ? '' : 's'}.
			{/if}
		</Alert>

		{#if mode === 'all'}
			<ul class="space-y-2">
				{#each files as file (file.name)}
					<li
						class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
					>
						<span>{file.name}</span>
						<Button type="button" variant="secondary" size="sm" onclick={() => downloadFile(file)}>
							Download
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
