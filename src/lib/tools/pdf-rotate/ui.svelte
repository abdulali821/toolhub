<script lang="ts">
	import { Alert, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { pdfRotate, run } from './index';

	let error = $state<string | null>(null);
	let sourceBytes = $state<Uint8Array | null>(null);
	let sourceName = $state('');
	let angle = $state<90 | 180 | 270>(90);
	let pageScope = $state<'all' | 'selected'>('all');
	let pagesSpec = $state('1');
	let outputBytes = $state<Uint8Array | null>(null);
	let pageCount = $state(0);
	let rotated = $state(0);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function rotate() {
		if (!sourceBytes) return;
		processing = true;
		error = null;
		try {
			const out = await run({
				pdf: sourceBytes,
				angle,
				pagesSpec: pageScope === 'all' ? 'all' : pagesSpec
			});
			outputBytes = out.pdfBytes;
			pageCount = out.pageCount;
			rotated = out.rotated;
		} catch (err) {
			outputBytes = null;
			error = err instanceof Error ? err.message : 'Failed to rotate PDF';
		} finally {
			processing = false;
		}
	}

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, pdfRotate.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		sourceName = file.name.replace(/\.pdf$/i, '');
		sourceBytes = new Uint8Array(await file.arrayBuffer());
		outputBytes = null;
		await rotate();
	}

	let downloadDataUrl = $derived(outputBytes ? pdfBytesToDataUrl(outputBytes) : '');

	$effect(() => {
		void [angle, pageScope, pagesSpec];
		if (sourceBytes) void rotate();
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: downloadDataUrl,
			downloadFilename: `${sourceName || 'document'}-rotated.pdf`,
			downloadMime: 'application/pdf',
			onReset: () => {
				error = null;
				sourceBytes = null;
				sourceName = '';
				angle = 90;
				pageScope = 'all';
				pagesSpec = '1';
				outputBytes = null;
				pageCount = 0;
				rotated = 0;
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
		accept={pdfRotate.file!.accept}
		aria-label="Upload PDF to rotate"
		onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if !sourceBytes}
		<p class="text-sm text-muted">Upload a PDF to rotate pages clockwise.</p>
	{/if}

	{#if sourceBytes}
		<Field id="pdf-rotate-angle" label="Rotation">
			<select
				id="pdf-rotate-angle"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={angle}
				aria-label="Rotation angle"
			>
				<option value={90}>90° clockwise</option>
				<option value={180}>180°</option>
				<option value={270}>270° clockwise (90° counter-clockwise)</option>
			</select>
		</Field>

		<Field id="pdf-rotate-scope" label="Pages">
			<select
				id="pdf-rotate-scope"
				class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
				bind:value={pageScope}
				aria-label="Page scope"
			>
				<option value="all">All pages</option>
				<option value="selected">Selected pages</option>
			</select>
		</Field>

		{#if pageScope === 'selected'}
			<Field id="pdf-rotate-pages" label="Page selection" hint="Example: 1,3-5">
				<input
					id="pdf-rotate-pages"
					type="text"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={pagesSpec}
					placeholder="1,3-5"
					aria-label="Pages to rotate"
				/>
			</Field>
		{/if}
	{/if}

	{#if processing}
		<p class="text-sm text-muted">Rotating…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if outputBytes && !processing}
		<Alert variant="success" title="Ready">
			Rotated {rotated} of {pageCount} page{pageCount === 1 ? '' : 's'} by {angle}°.
		</Alert>
	{/if}
</div>
