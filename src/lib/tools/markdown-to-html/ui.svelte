<script lang="ts">
	import { Field, Textarea } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { markdownToHtml, run } from './index';

	const shareKeys = markdownToHtml.share!.params;
	const maxParamBytes = markdownToHtml.share!.maxParamBytes;
	const DEFAULT_MARKDOWN = `# HeyTools

Convert **Markdown** to clean, copyable HTML.

- Fast
- Private
- Free

\`inline code\` and [links](https://example.com) work too.
`;

	function fromUrl() {
		const sp = urlSearchParams();
		return { markdown: readShareParam(sp, 'markdown') ?? DEFAULT_MARKDOWN };
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
