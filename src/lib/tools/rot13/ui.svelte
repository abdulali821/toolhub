<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { rot13, run } from './index';

	const shareKeys = rot13.share!.params;
	const DEFAULT_TEXT = 'Hello ToolHub';

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
			defaults: { text: DEFAULT_TEXT }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.result,
			downloadValue: output.result,
			downloadFilename: 'rot13.txt',
			onReset: () => {
				text = DEFAULT_TEXT;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="rot13-input" label="Input">
		<Textarea id="rot13-input" bind:value={text} rows={6} class="font-mono text-sm" />
	</Field>

	<Field id="rot13-output" label="Output">
		<Textarea id="rot13-output" value={output.result} rows={6} readonly class="font-mono text-sm" />
	</Field>
</div>
