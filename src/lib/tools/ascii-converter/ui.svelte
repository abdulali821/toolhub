<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { asciiConverter, run, type AsciiConverterInput } from './index';

	const shareKeys = asciiConverter.share!.params;
	const DEFAULT_TEXT = 'Hello';
	const DEFAULT_MODE: AsciiConverterInput['mode'] = 'encode';

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode: AsciiConverterInput['mode'] =
			modeRaw === 'decode' || modeRaw === 'encode' ? modeRaw : DEFAULT_MODE;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			mode
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let mode = $state<AsciiConverterInput['mode']>(initial.mode);
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
			downloadFilename: 'ascii.txt',
			onReset: () => {
				text = DEFAULT_TEXT;
				mode = DEFAULT_MODE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="ascii-mode" label="Mode">
		<select
			id="ascii-mode"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={mode}
		>
			<option value="encode">Encode (text → codes)</option>
			<option value="decode">Decode (codes → text)</option>
		</select>
	</Field>

	<Field id="ascii-input" label="Input">
		<Textarea id="ascii-input" bind:value={text} rows={6} class="font-mono text-sm" />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{/if}

	<Field id="ascii-output" label="Output">
		<Textarea id="ascii-output" value={output.result} rows={6} readonly class="font-mono text-sm" />
	</Field>
</div>
