<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { Alert, Field, Textarea } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { pullShareState, urlSearchParams, readShareParam } from '$engine/tool-share';
	import { readFileAsText } from '$lib/utils/file';
	import { renderMermaidIn } from '$lib/utils/mermaid-render';
	import { markdownPreview, run } from './index';

	const DEFAULT_MARKDOWN = `# HeyTools

Write **Markdown** on the left.

- Fast
- Private
- Free

\`inline code\` and [links](https://example.com) work too.

\`\`\`
code fence
\`\`\`
`;

	/** Presets write `?markdown=`; we apply once then strip so the URL stays short. */
	function markdownFromUrl(): string | null {
		return readShareParam(urlSearchParams(), 'markdown');
	}

	function stripMarkdownFromUrl() {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		if (!url.searchParams.has('markdown')) return;
		url.searchParams.delete('markdown');
		const next = url.pathname + url.search;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- clear one-shot preset/share param
		replaceState(next, {});
	}

	const initialMarkdown = markdownFromUrl() ?? DEFAULT_MARKDOWN;
	let markdown = $state(initialMarkdown);
	let fileName = $state('');
	let uploadError = $state<string | null>(null);
	let previewEl = $state<HTMLDivElement | null>(null);
	let html = $derived(run({ markdown }).html);

	async function onselect(file: File) {
		uploadError = null;
		markdown = await readFileAsText(file);
		fileName = file.name;
	}

	function onerror(message: string) {
		uploadError = message;
	}

	$effect(() => {
		pullShareState(markdownFromUrl, (next) => {
			if (next === null) return;
			if (next !== markdown) markdown = next;
			stripMarkdownFromUrl();
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: markdown,
			downloadValue: markdown,
			downloadFilename: fileName || 'preview.md',
			downloadMime: 'text/markdown;charset=utf-8',
			onReset: () => {
				markdown = DEFAULT_MARKDOWN;
				fileName = '';
				uploadError = null;
			}
		});
	});

	$effect(() => {
		const container = previewEl;
		const rendered = html;
		if (!container || !rendered) return;

		void renderMermaidIn(container).catch(() => {
			// Preview still shows source if Mermaid fails to parse.
		});
	});
</script>

<div class="flex flex-col gap-6">
	<Dropzone
		constraints={markdownPreview.file!}
		label="Upload a Markdown file"
		hint=".md or .markdown up to 2 MB"
		{onselect}
		{onerror}
	/>

	{#if uploadError}
		<Alert variant="danger" title="Upload error">{uploadError}</Alert>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2">
		<Field id="md-input" label="Markdown">
			<Textarea id="md-input" bind:value={markdown} rows={18} class="font-mono text-sm" />
		</Field>
		<div>
			<p class="mb-1.5 text-sm font-medium text-fg">Preview</p>
			<div
				bind:this={previewEl}
				class="prose min-h-96 max-w-none rounded-md border border-border bg-bg px-4 py-3 text-fg prose-neutral dark:prose-invert"
			>
				<!-- HTML is produced by run() after escapeHtml + allowlisted tags only -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html html}
			</div>
		</div>
	</div>
</div>

<style>
	:global(.prose .mermaid) {
		background: transparent;
		margin: 1rem 0;
		overflow-x: auto;
	}
</style>
