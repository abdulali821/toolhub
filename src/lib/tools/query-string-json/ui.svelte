<script lang="ts">
	import { Alert, Button, Field, Textarea } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { queryStringJson, run, type QueryStringJsonInput } from './index';

	const shareKeys = queryStringJson.share!.params;
	const maxParamBytes = queryStringJson.share!.maxParamBytes;
	const DEFAULT_MODE: QueryStringJsonInput['mode'] = 'to-json';
	const DEFAULT_TEXT = 'a=1&b=2&tag=x&tag=y';

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode: QueryStringJsonInput['mode'] = modeRaw === 'to-query' ? 'to-query' : DEFAULT_MODE;
		return {
			mode,
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT
		};
	}

	const initial = fromUrl();
	let mode = $state<QueryStringJsonInput['mode']>(initial.mode);
	let text = $state(initial.text);
	let output = $derived(run({ mode, text }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.mode !== mode) mode = next.mode;
			if (next.text !== text) text = next.text;
		});
	});

	$effect(() => {
		pushShareState({ mode, text }, shareKeys, {
			defaults: { mode: DEFAULT_MODE, text: DEFAULT_TEXT },
			maxParamBytes
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.result,
			downloadValue: output.error ? '' : output.result,
			downloadFilename: mode === 'to-json' ? 'query-params.json' : 'query-string.txt',
			onReset: () => {
				mode = DEFAULT_MODE;
				text = DEFAULT_TEXT;
			}
		});
	});

	function swap() {
		mode = mode === 'to-json' ? 'to-query' : 'to-json';
		if (!output.error && output.result) text = output.result;
	}
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="qsj-mode" label="Mode">
		<select
			id="qsj-mode"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			bind:value={mode}
		>
			<option value="to-json">Query string → JSON</option>
			<option value="to-query">JSON → query string</option>
		</select>
	</Field>

	<Field
		id="qsj-input"
		label={mode === 'to-json' ? 'Query string' : 'JSON object'}
		hint={mode === 'to-json'
			? 'With or without a leading ?'
			: 'A flat object; array values become repeated keys'}
	>
		<Textarea id="qsj-input" bind:value={text} rows={8} class="font-mono text-sm" />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{/if}

	<Field id="qsj-output" label="Result">
		<Textarea id="qsj-output" value={output.result} rows={8} readonly class="font-mono text-sm" />
	</Field>

	<div class="flex flex-wrap gap-2">
		<CopyButton value={output.result} />
		<Button type="button" variant="ghost" size="sm" onclick={swap} disabled={!!output.error}>
			Use result as input & swap mode
		</Button>
	</div>
</div>
