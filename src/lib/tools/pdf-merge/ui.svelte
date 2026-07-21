<script lang="ts">
	import { Alert, Button } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { pdfMerge, mergePdfBytes } from './index';

	type ListedPdf = { name: string; bytes: Uint8Array };

	let error = $state<string | null>(null);
	let files = $state<ListedPdf[]>([]);
	let mergedBytes = $state<Uint8Array | null>(null);
	let pageCount = $state(0);
	let merging = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function addFiles(list: FileList | null) {
		if (!list?.length) return;
		error = null;
		mergedBytes = null;

		for (const file of Array.from(list)) {
			const result = validateFile(file, pdfMerge.file!);
			if (!result.ok) {
				error = result.error;
				continue;
			}
			const buffer = new Uint8Array(await file.arrayBuffer());
			files = [...files, { name: file.name, bytes: buffer }];
		}

		if (files.length) await mergeAll();
	}

	async function mergeAll() {
		if (!files.length) return;
		merging = true;
		error = null;
		try {
			const out = await mergePdfBytes(files.map((f) => f.bytes));
			mergedBytes = out.pdfBytes;
			pageCount = out.pageCount;
		} catch (err) {
			mergedBytes = null;
			pageCount = 0;
			error = err instanceof Error ? err.message : 'Failed to merge PDFs';
		} finally {
			merging = false;
		}
	}

	function removeAt(index: number) {
		files = files.filter((_, i) => i !== index);
		if (files.length) void mergeAll();
		else {
			mergedBytes = null;
			pageCount = 0;
		}
	}

	function moveUp(index: number) {
		if (index <= 0) return;
		const next = [...files];
		[next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
		files = next;
		void mergeAll();
	}

	let downloadDataUrl = $derived(mergedBytes ? pdfBytesToDataUrl(mergedBytes) : '');

	$effect(() => {
		setToolShellActions({
			downloadValue: downloadDataUrl,
			downloadFilename: 'merged.pdf',
			downloadMime: 'application/pdf',
			onReset: () => {
				error = null;
				files = [];
				mergedBytes = null;
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
		<p class="font-medium text-fg">Add PDF files</p>
		<p class="mt-1 text-sm text-muted">Select one or more PDFs (max 10 MB each)</p>
	</div>

	<input
		bind:this={inputEl}
		type="file"
		class="sr-only"
		accept={pdfMerge.file!.accept}
		multiple
		aria-label="Upload PDF files to merge"
		onchange={(e) => addFiles((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if files.length}
		<ul class="space-y-2">
			{#each files as file, index (file.name + index)}
				<li
					class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
				>
					<span>{index + 1}. {file.name}</span>
					<div class="flex gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={() => moveUp(index)}
							disabled={index === 0}
						>
							Up
						</Button>
						<Button type="button" variant="ghost" size="sm" onclick={() => removeAt(index)}>
							Remove
						</Button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	{#if merging}
		<p class="text-sm text-muted">Merging…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if mergedBytes}
		<Alert variant="success" title="Ready">
			Merged {files.length} file{files.length === 1 ? '' : 's'} · {pageCount} page{pageCount === 1
				? ''
				: 's'}
		</Alert>
	{/if}
</div>
