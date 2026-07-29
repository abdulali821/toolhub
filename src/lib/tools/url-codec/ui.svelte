<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { urlCodec, run, type UrlCodecInput } from './index';

	const shareKeys = urlCodec.share!.params;
	const DEFAULT_TEXT = 'hello world & tools=1';
	const DEFAULT_MODE: UrlCodecInput['mode'] = 'encode';

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode: UrlCodecInput['mode'] =
			modeRaw === 'decode' || modeRaw === 'encode' ? modeRaw : DEFAULT_MODE;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			mode
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let mode = $state<UrlCodecInput['mode']>(initial.mode);
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
			downloadFilename: 'url-codec.txt',
			onReset: () => {
				text = DEFAULT_TEXT;
				mode = DEFAULT_MODE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="url-mode" label="Mode">
		<select
			id="url-mode"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			bind:value={mode}
		>
			<option value="encode">Encode</option>
			<option value="decode">Decode</option>
		</select>
	</Field>

	<Field id="url-input" label="Input">
		<Textarea id="url-input" bind:value={text} rows={5} class="font-mono text-sm" />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{/if}

	<Field id="url-output" label="Output">
		<Textarea id="url-output" value={output.result} rows={5} readonly class="font-mono text-sm" />
	</Field>
</div>
