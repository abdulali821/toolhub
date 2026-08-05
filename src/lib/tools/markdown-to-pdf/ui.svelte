<script lang="ts">
	import type { Action } from 'svelte/action';
	import { Alert, Button, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { pdfBytesToDataUrl } from '$lib/utils/pdf';
	import { renderPdfPages, type RenderedPage } from '../pdf-to-images/render';
	import { markdownToPdf, run } from './index';

	const shareKeys = markdownToPdf.share!.params;
	const maxParamBytes = markdownToPdf.share!.maxParamBytes;
	const DEFAULT_MARKDOWN = `# HeyTools

Convert **Markdown** notes into a downloadable PDF.

## Features

- Headings and paragraphs
- Bullet lists
- Code fences

> Private by default — rendered locally with pdf-lib.

\`\`\`
npm start
\`\`\`
`;

	const portal: Action<HTMLElement> = (node) => {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	};

	function fromUrl() {
		const sp = urlSearchParams();
		return { markdown: readShareParam(sp, 'markdown') ?? DEFAULT_MARKDOWN };
	}

	const initial = fromUrl();
	let markdown = $state(initial.markdown);
	let dataUrl = $state('');
	let pages = $state<RenderedPage[]>([]);
	let pageCount = $state(0);
	let error = $state<string | null>(null);
	let loading = $state(false);
	let previewIndex = $state<number | null>(null);

	const previewPage = $derived(previewIndex === null ? null : (pages[previewIndex] ?? null));
	const canGoPrev = $derived(previewIndex !== null && previewIndex > 0);
	const canGoNext = $derived(previewIndex !== null && previewIndex < pages.length - 1);

	function clearOutput() {
		dataUrl = '';
		pages = [];
		pageCount = 0;
		previewIndex = null;
	}

	async function setPreviewFromBytes(bytes: Uint8Array, count: number) {
		dataUrl = pdfBytesToDataUrl(bytes);
		pageCount = count;
		const pageNumbers = Array.from({ length: count }, (_, i) => i + 1);
		pages = await renderPdfPages(bytes, pageNumbers, 1.25);
	}

	async function generate(text = markdown) {
		if (!text.trim()) {
			clearOutput();
			error = 'Enter some Markdown';
			return;
		}
		loading = true;
		error = null;
		previewIndex = null;
		try {
			const out = await run({ markdown: text });
			await setPreviewFromBytes(out.bytes, out.pageCount);
		} catch (err) {
			clearOutput();
			error = err instanceof Error ? err.message : 'Failed to generate PDF';
		} finally {
			loading = false;
		}
	}

	function openPreview(index: number) {
		if (index < 0 || index >= pages.length) return;
		previewIndex = index;
	}

	function closePreview() {
		previewIndex = null;
	}

	function goPrev() {
		if (canGoPrev && previewIndex !== null) previewIndex -= 1;
	}

	function goNext() {
		if (canGoNext && previewIndex !== null) previewIndex += 1;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (previewIndex === null) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			closePreview();
			return;
		}
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goPrev();
			return;
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			goNext();
		}
	}

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.markdown !== markdown) {
				markdown = next.markdown;
				void generate(next.markdown);
			}
		});
	});

	$effect(() => {
		pushShareState({ markdown }, shareKeys, {
			maxParamBytes,
			defaults: { markdown: DEFAULT_MARKDOWN }
		});
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: dataUrl,
			downloadFilename: 'markdown.pdf',
			downloadMime: 'application/pdf',
			onReset: () => {
				markdown = DEFAULT_MARKDOWN;
				void generate(DEFAULT_MARKDOWN);
			}
		});
	});

	void generate(initial.markdown);
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-4">
		<Field id="mtp-input" label="Markdown" required>
			<Textarea id="mtp-input" bind:value={markdown} rows={14} class="font-mono text-sm" />
		</Field>

		<div class="flex flex-wrap items-center gap-3">
			<Button type="button" onclick={() => generate()} disabled={loading}>
				{loading ? 'Generating…' : 'Generate / Preview'}
			</Button>
			{#if pageCount > 0 && !error && !loading}
				<p class="text-sm text-muted">
					{pageCount} page{pageCount === 1 ? '' : 's'} ready — Download from the Action Bar.
				</p>
			{/if}
		</div>

		{#if error}
			<Alert variant="danger" title="Error">{error}</Alert>
		{/if}
	</div>

	<div class="flex flex-col gap-3">
		<p class="text-sm font-medium text-fg">Page preview</p>

		{#if loading}
			<div
				class="flex min-h-48 items-center justify-center rounded-2xl border border-border bg-bg p-8 text-sm text-muted"
			>
				Rendering pages…
			</div>
		{:else if pages.length}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each pages as page, index (page.pageNumber)}
					<figure class="group overflow-hidden rounded-xl border border-border bg-bg-elevated">
						<div class="relative bg-white">
							<img
								src={page.dataUrl}
								alt="PDF page {page.pageNumber}"
								class="w-full object-contain"
							/>
							<button
								type="button"
								class="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/40 group-hover:opacity-100 focus-visible:bg-black/40 focus-visible:opacity-100 [@media(hover:none)]:bg-black/25 [@media(hover:none)]:opacity-100"
								aria-label="Preview page {page.pageNumber}"
								onclick={() => openPreview(index)}
							>
								<span
									class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg-elevated text-fg shadow-lg"
								>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path
											d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
											stroke="currentColor"
											stroke-width="1.75"
											stroke-linejoin="round"
										/>
										<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75" />
									</svg>
								</span>
							</button>
						</div>
						<figcaption class="border-t border-border px-3 py-2 text-xs text-muted">
							Page {page.pageNumber} of {pageCount}
						</figcaption>
					</figure>
				{/each}
			</div>
		{:else}
			<div
				class="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-bg p-8 text-center text-sm text-muted"
			>
				Generate a PDF to preview pages here.
			</div>
		{/if}
	</div>
</div>

{#if previewPage && previewIndex !== null}
	<div use:portal class="fixed inset-0 z-100 flex items-center justify-center p-4">
		<button
			type="button"
			class="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
			aria-label="Close page preview"
			onclick={closePreview}
		></button>

		<div
			class="relative z-10 flex max-h-[min(92vh,58rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated text-fg shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Page {previewPage.pageNumber} preview"
			tabindex="-1"
		>
			<div class="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
				<p class="text-sm font-medium text-fg">
					Page {previewPage.pageNumber} of {pageCount}
				</p>
				<button
					type="button"
					class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-bg hover:text-fg"
					aria-label="Close"
					onclick={closePreview}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			<div class="overflow-auto bg-bg p-4">
				<img
					src={previewPage.dataUrl}
					alt="PDF page {previewPage.pageNumber} full preview"
					class="mx-auto max-h-[min(68vh,44rem)] w-auto max-w-full rounded-md bg-white object-contain shadow-sm"
				/>
			</div>

			{#if pages.length > 1}
				<div class="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={goPrev}
						disabled={!canGoPrev}
					>
						← Previous
					</Button>
					<p class="text-xs text-muted">Use ← → keys</p>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={goNext}
						disabled={!canGoNext}
					>
						Next →
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
