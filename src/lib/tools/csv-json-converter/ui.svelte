<script lang="ts">
	import { Alert, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { csvJsonConverter, run, type CsvJsonInput } from './index';

	const shareKeys = csvJsonConverter.share!.params;
	const maxParamBytes = csvJsonConverter.share!.maxParamBytes;
	const DEFAULT_TEXT = 'name,role\nAda,Engineer\nGrace,Scientist';
	const DEFAULT_MODE: CsvJsonInput['mode'] = 'csv-to-json';
	const DEFAULT_DELIMITER = ',';
	const MODES = new Set<CsvJsonInput['mode']>(['csv-to-json', 'json-to-csv']);

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode =
			modeRaw && MODES.has(modeRaw as CsvJsonInput['mode'])
				? (modeRaw as CsvJsonInput['mode'])
				: DEFAULT_MODE;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			mode,
			delimiter: readShareParam(sp, 'delimiter') ?? DEFAULT_DELIMITER
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let mode = $state<CsvJsonInput['mode']>(initial.mode);
	let delimiter = $state(initial.delimiter);
	let output = $derived(run({ text, mode, delimiter }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.mode !== mode) mode = next.mode;
			if (next.delimiter !== delimiter) delimiter = next.delimiter;
		});
	});

	$effect(() => {
		pushShareState({ text, mode, delimiter }, shareKeys, {
			maxParamBytes,
			defaults: { text: DEFAULT_TEXT, mode: DEFAULT_MODE, delimiter: DEFAULT_DELIMITER }
		});
	});

	$effect(() => {
		const isJsonOutput = mode === 'csv-to-json';
		setToolShellActions({
			copyValue: output.error ? '' : output.result,
			downloadValue: output.error ? '' : output.result,
			downloadFilename: isJsonOutput ? 'converted.json' : 'converted.csv',
			downloadMime: isJsonOutput ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8',
			onReset: () => {
				text = DEFAULT_TEXT;
				mode = DEFAULT_MODE;
				delimiter = DEFAULT_DELIMITER;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="cj-mode" label="Mode">
			<select
				id="cj-mode"
				class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
				bind:value={mode}
			>
				<option value="csv-to-json">CSV → JSON</option>
				<option value="json-to-csv">JSON → CSV</option>
			</select>
		</Field>
		<Field id="cj-delimiter" label="Delimiter">
			<Input id="cj-delimiter" bind:value={delimiter} class="font-mono" maxlength={1} />
		</Field>
	</div>

	<Field id="cj-input" label="Input">
		<Textarea id="cj-input" bind:value={text} rows={10} class="font-mono text-sm" />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{/if}

	<Field id="cj-output" label="Output">
		<Textarea id="cj-output" value={output.result} rows={10} readonly class="font-mono text-sm" />
	</Field>
</div>
