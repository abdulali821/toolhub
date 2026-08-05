<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { Field, Textarea } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { pullShareState, urlSearchParams, readShareParam } from '$engine/tool-share';
	import { run } from './index';

	const DEFAULT_MARKDOWN = `# HeyTools

Convert **Markdown** to clean, copyable HTML.

- Fast
- Private
- Free

\`inline code\` and [links](https://example.com) work too.
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
			copyValue: html,
			downloadValue: html,
			downloadFilename: 'converted.html',
			downloadMime: 'text/html;charset=utf-8',
			onReset: () => {
				markdown = DEFAULT_MARKDOWN;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="mth-input" label="Markdown">
		<Textarea id="mth-input" bind:value={markdown} rows={18} class="font-mono text-sm" />
	</Field>
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between">
			<p class="text-sm font-medium text-fg">HTML output</p>
			<CopyButton value={html} />
		</div>
		<Textarea id="mth-output" value={html} rows={18} readonly class="font-mono text-sm" />
	</div>
</div>
