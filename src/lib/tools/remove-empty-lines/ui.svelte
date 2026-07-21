<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { removeEmptyLines, run } from './index';

	const shareKeys = removeEmptyLines.share!.params;
	const maxParamBytes = removeEmptyLines.share!.maxParamBytes;
	const DEFAULT_TEXT = 'alpha\n\n  \n\nbeta\n   \ngamma\n';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let output = $derived(run({ text }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
		});
	});

	$effect(() => {
		pushShareState({ text }, shareKeys, {
			maxParamBytes,
			defaults: { text: DEFAULT_TEXT }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.result,
			onReset: () => {
				text = DEFAULT_TEXT;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="rel-text" label="Text">
		<Textarea id="rel-text" bind:value={text} rows={10} class="font-mono text-sm" />
	</Field>

	<p class="text-sm text-muted">
		Removed {output.removed} empty line{output.removed === 1 ? '' : 's'}
	</p>

	<Field id="rel-output" label="Result">
		<Textarea id="rel-output" value={output.result} rows={10} readonly class="font-mono text-sm" />
	</Field>
</div>
