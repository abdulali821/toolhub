<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { jsonFormatter, run } from './index';

	const shareKeys = jsonFormatter.share!.params;
	const maxParamBytes = jsonFormatter.share!.maxParamBytes;

	const DEFAULT_JSON = '{\n  "hello": "world"\n}';

	function stateFromUrl() {
		const sp = page.url.searchParams;
		return {
			json: readShareParam(sp, 'json') ?? DEFAULT_JSON,
			indent: readShareNumber(sp, 'indent', 2)
		};
	}

	const initial = stateFromUrl();
	let json = $state(initial.json);
	let indent = $state(initial.indent);
	let result = $derived(run({ json, indent: Number(indent) }));

	// Apply URL changes from presets / reset / browser history.
	// Local state reads are untracked so typing never re-triggers this effect —
	// it must only depend on page.url.
	$effect(() => {
		const next = stateFromUrl();
		untrack(() => {
			if (next.json !== json) json = next.json;
			if (next.indent !== Number(indent)) indent = next.indent;
		});
	});

	$effect(() => {
		syncShareParams({ json, indent }, shareKeys, {
			maxParamBytes,
			defaults: { json: DEFAULT_JSON, indent: '2' }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result.valid ? result.formatted : '',
			downloadValue: result.valid ? result.formatted : '',
			downloadFilename: 'formatted.json',
			downloadMime: 'application/json;charset=utf-8',
			onReset: () => {
				json = DEFAULT_JSON;
				indent = 2;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="json-input" label="JSON input" required>
		<Textarea
			id="json-input"
			bind:value={json}
			rows={14}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<div class="flex flex-col gap-3">
		<div class="flex items-center justify-between gap-3">
			<label class="text-sm font-medium" for="indent">Indent</label>
			<select
				id="indent"
				class="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm"
				bind:value={indent}
			>
				<option value={0}>Minified</option>
				<option value={2}>2 spaces</option>
				<option value={4}>4 spaces</option>
			</select>
		</div>

		{#if !result.valid && result.error}
			<Alert variant="danger" title="Invalid JSON">{result.error}</Alert>
		{:else}
			<Alert variant="success" title="Valid JSON">Formatted successfully.</Alert>
		{/if}

		<Field id="json-output" label="Output">
			<Textarea
				id="json-output"
				value={result.formatted}
				rows={12}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
