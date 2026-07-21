<script lang="ts">
	import { Alert, Button } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { validateFile } from '$lib/utils/file';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { imagesToPdf, run } from './index';

	type ListedImage = { name: string; bytes: Uint8Array; mime: string };

	let error = $state<string | null>(null);
	let images = $state<ListedImage[]>([]);
	let outputBytes = $state<Uint8Array | null>(null);
	let pageCount = $state(0);
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	async function buildPdf() {
		if (!images.length) {
			outputBytes = null;
			pageCount = 0;
			return;
		}
		processing = true;
		error = null;
		try {
			const out = await run({
				images: images.map((img) => ({ bytes: img.bytes, mime: img.mime }))
			});
			outputBytes = out.pdfBytes;
			pageCount = out.pageCount;
		} catch (err) {
			outputBytes = null;
			pageCount = 0;
			error = err instanceof Error ? err.message : 'Failed to create PDF';
		} finally {
			processing = false;
		}
	}

	async function addFiles(list: FileList | null) {
		if (!list?.length) return;
		error = null;
		outputBytes = null;

		for (const file of Array.from(list)) {
			const result = validateFile(file, imagesToPdf.file!);
			if (!result.ok) {
				error = result.error;
				continue;
			}
			const buffer = new Uint8Array(await file.arrayBuffer());
			images = [...images, { name: file.name, bytes: buffer, mime: file.type || 'image/png' }];
		}

		if (images.length) await buildPdf();
	}

	function removeAt(index: number) {
		images = images.filter((_, i) => i !== index);
		if (images.length) void buildPdf();
		else {
			outputBytes = null;
			pageCount = 0;
		}
	}

	function moveUp(index: number) {
		if (index <= 0) return;
		const next = [...images];
		[next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
		images = next;
		void buildPdf();
	}

	let downloadDataUrl = $derived(outputBytes ? pdfBytesToDataUrl(outputBytes) : '');

	$effect(() => {
		setToolShellActions({
			downloadValue: downloadDataUrl,
			downloadFilename: 'images.pdf',
			downloadMime: 'application/pdf',
			onReset: () => {
				error = null;
				images = [];
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
		<p class="font-medium text-fg">Add images</p>
		<p class="mt-1 text-sm text-muted">PNG or JPEG, up to 10 MB each</p>
	</div>

	<input
		bind:this={inputEl}
		type="file"
		class="sr-only"
		accept={imagesToPdf.file!.accept}
		multiple
		aria-label="Upload PNG or JPEG images"
		onchange={(e) => addFiles((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if !images.length}
		<p class="text-sm text-muted">Add PNG or JPEG images to combine them into a PDF.</p>
	{/if}

	{#if images.length}
		<ul class="space-y-2">
			{#each images as image, index (image.name + index)}
				<li
					class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
				>
					<span>{index + 1}. {image.name}</span>
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

	{#if processing}
		<p class="text-sm text-muted">Building PDF…</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if outputBytes && !processing}
		<Alert variant="success" title="Ready">
			Created PDF with {pageCount} page{pageCount === 1 ? '' : 's'} from {images.length} image{images.length ===
			1
				? ''
				: 's'}.
		</Alert>
	{/if}
</div>
