<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { jsonMinifier, run } from './index';

	const shareKeys = jsonMinifier.share!.params;
	const maxParamBytes = jsonMinifier.share!.maxParamBytes;
	const DEFAULT_JSON = '{\n  "hello": "world",\n  "items": [1, 2, 3]\n}';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			json: readShareParam(sp, 'json') ?? DEFAULT_JSON
		};
	}

	const initial = fromUrl();
	let json = $state(initial.json);
	let result = $derived(run({ json }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.json !== json) json = next.json;
		});
	});

	$effect(() => {
		pushShareState({ json }, shareKeys, {
			maxParamBytes,
			defaults: { json: DEFAULT_JSON }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result.valid ? result.minified : '',
			downloadValue: result.valid ? result.minified : '',
			downloadFilename: 'minified.json',
			downloadMime: 'application/json;charset=utf-8',
			onReset: () => {
				json = DEFAULT_JSON;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="json-minifier-input" label="JSON input" required>
		<Textarea
			id="json-minifier-input"
			bind:value={json}
			rows={14}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<div class="flex flex-col gap-3">
		{#if !result.valid && result.error}
			<Alert variant="danger" title="Invalid JSON">{result.error}</Alert>
		{:else}
			<Alert variant="success" title="Minified">
				{result.originalBytes} bytes → {result.minifiedBytes} bytes ({result.originalBytes -
					result.minifiedBytes} saved)
			</Alert>
		{/if}

		<Field id="json-minifier-output" label="Minified output">
			<Textarea
				id="json-minifier-output"
				value={result.minified}
				rows={12}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
