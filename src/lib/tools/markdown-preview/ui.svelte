<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { markdownPreview, run } from './index';

	const shareKeys = markdownPreview.share!.params;
	const maxParamBytes = markdownPreview.share!.maxParamBytes;
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

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			markdown: readShareParam(sp, 'markdown') ?? DEFAULT_MARKDOWN
		};
	}

	const initial = fromUrl();
	let markdown = $state(initial.markdown);
	let html = $derived(run({ markdown }).html);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.markdown !== markdown) markdown = next.markdown;
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
