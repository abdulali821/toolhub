<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { htmlCodec, run, type HtmlCodecInput } from './index';

	const shareKeys = htmlCodec.share!.params;
	const DEFAULT_TEXT = '<div class="hello">HeyTools & friends</div>';
	const DEFAULT_MODE: HtmlCodecInput['mode'] = 'encode';

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode: HtmlCodecInput['mode'] =
			modeRaw === 'decode' || modeRaw === 'encode' ? modeRaw : DEFAULT_MODE;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			mode
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let mode = $state<HtmlCodecInput['mode']>(initial.mode);
	let result = $derived(run({ text, mode }).result);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.mode !== mode) mode = next.mode;
		});
	});

	$effect(() => {
		pushShareState({ text, mode }, shareKeys, {
			defaults: { text: DEFAULT_TEXT, mode: DEFAULT_MODE }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result,
			downloadValue: result,
			downloadFilename: 'html-codec.txt',
			onReset: () => {
				text = DEFAULT_TEXT;
				mode = DEFAULT_MODE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="html-mode" label="Mode">
		<select
			id="html-mode"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			bind:value={mode}
		>
			<option value="encode">Encode</option>
			<option value="decode">Decode</option>
		</select>
	</Field>
	<Field id="html-input" label="Input">
		<Textarea id="html-input" bind:value={text} rows={7} class="font-mono text-sm" />
	</Field>
	<Field id="html-output" label="Output">
		<Textarea id="html-output" value={result} rows={7} readonly class="font-mono text-sm" />
	</Field>
</div>
