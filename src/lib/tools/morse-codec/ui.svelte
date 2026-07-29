<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { morseCodec, run, type MorseCodecInput } from './index';

	const shareKeys = morseCodec.share!.params;
	const DEFAULT_TEXT = 'SOS';
	const DEFAULT_MODE: MorseCodecInput['mode'] = 'encode';

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode: MorseCodecInput['mode'] =
			modeRaw === 'decode' || modeRaw === 'encode' ? modeRaw : DEFAULT_MODE;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			mode
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let mode = $state<MorseCodecInput['mode']>(initial.mode);
	let output = $derived(run({ text, mode }));

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
		const value = output.error ? '' : output.result;
		setToolShellActions({
			copyValue: value,
			downloadValue: value,
			downloadFilename: 'morse.txt',
			onReset: () => {
				text = DEFAULT_TEXT;
				mode = DEFAULT_MODE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="morse-mode" label="Mode">
		<select
			id="morse-mode"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			bind:value={mode}
		>
			<option value="encode">Encode (text → Morse)</option>
			<option value="decode">Decode (Morse → text)</option>
		</select>
	</Field>

	<Field id="morse-input" label="Input">
		<Textarea id="morse-input" bind:value={text} rows={6} class="font-mono text-sm" />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{/if}

	<Field id="morse-output" label="Output">
		<Textarea id="morse-output" value={output.result} rows={6} readonly class="font-mono text-sm" />
	</Field>
</div>
