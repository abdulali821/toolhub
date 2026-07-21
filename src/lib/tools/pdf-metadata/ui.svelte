<script lang="ts">
	import { Alert } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { formatBytes } from '$lib/utils/bytes';
	import { validateFile } from '$lib/utils/file';
	import type { PdfMetaField } from '$lib/utils/pdf';
	import { pdfMetadata, run } from './index';

	let error = $state<string | null>(null);
	let fields = $state<PdfMetaField[]>([]);
	let pageCount = $state(0);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, pdfMetadata.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		processing = true;
		error = null;
		fields = [];
		try {
			const bytes = new Uint8Array(await file.arrayBuffer());
			const out = await run({ pdf: bytes });
			pageCount = out.pageCount;
			fields = out.fields.map((field) =>
				field.key === 'File size' ? { ...field, value: formatBytes(bytes.length) } : field
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to read PDF metadata';
		} finally {
			processing = false;
		}
	}

	$effect(() => {
		setToolShellActions({
			onReset: () => {
				error = null;
				fields = [];
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
		accept={pdfMetadata.file!.accept}
		aria-label="Upload PDF to view metadata"
		onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if !fields.length && !processing}
		<p class="text-sm text-muted">Upload a PDF to inspect its document properties.</p>
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Reading metadata…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if fields.length && !processing}
		<Alert variant="success" title="Document info">
			{pageCount} page{pageCount === 1 ? '' : 's'} · {fields.length} properties
		</Alert>

		<dl class="divide-y divide-border rounded-md border border-border">
			{#each fields as field (field.key)}
				<div class="grid gap-1 px-4 py-3 sm:grid-cols-3">
					<dt class="text-sm font-medium text-muted">{field.key}</dt>
					<dd class="text-sm break-words sm:col-span-2">{field.value}</dd>
				</div>
			{/each}
		</dl>
	{/if}
</div>
