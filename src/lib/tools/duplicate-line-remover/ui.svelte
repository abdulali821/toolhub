<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { duplicateLineRemover, run } from './index';

	const shareKeys = duplicateLineRemover.share!.params;
	const maxParamBytes = duplicateLineRemover.share!.maxParamBytes;
	const DEFAULT_TEXT = 'alpha\nbeta\nalpha\ngamma\nbeta\ndelta\nalpha';

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
	<Field id="dlr-text" label="Lines">
		<Textarea id="dlr-text" bind:value={text} rows={10} class="font-mono text-sm" />
	</Field>

	<p class="text-sm text-muted">
		Kept {output.kept} · Removed {output.removed} duplicate{output.removed === 1 ? '' : 's'}
	</p>

	<Field id="dlr-output" label="Unique lines">
		<Textarea id="dlr-output" value={output.result} rows={10} readonly class="font-mono text-sm" />
	</Field>
</div>
