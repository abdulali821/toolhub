<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { pullShareState, urlSearchParams, readShareParam } from '$engine/tool-share';
	import { run } from './index';

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
	let html = $derived(run({ markdown }).html);

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
			downloadFilename: 'preview.md',
			downloadMime: 'text/markdown;charset=utf-8',
			onReset: () => {
				markdown = DEFAULT_MARKDOWN;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="md-input" label="Markdown">
		<Textarea id="md-input" bind:value={markdown} rows={18} class="font-mono text-sm" />
	</Field>
	<div>
		<p class="mb-1.5 text-sm font-medium text-fg">Preview</p>
		<div
			class="prose min-h-96 max-w-none rounded-md border border-border bg-bg px-4 py-3 prose-neutral dark:prose-invert"
		>
			<!-- HTML is produced by run() after escapeHtml + allowlisted tags only -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html html}
		</div>
	</div>
</div>
