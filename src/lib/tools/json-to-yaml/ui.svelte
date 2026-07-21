<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { jsonToYaml, run } from './index';

	const shareKeys = jsonToYaml.share!.params;
	const maxParamBytes = jsonToYaml.share!.maxParamBytes;
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
			copyValue: result.valid ? result.yaml : '',
			downloadValue: result.valid ? result.yaml : '',
			downloadFilename: 'converted.yaml',
			downloadMime: 'text/yaml;charset=utf-8',
			onReset: () => {
				json = DEFAULT_JSON;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="json-to-yaml-input" label="JSON input" required>
		<Textarea
			id="json-to-yaml-input"
			bind:value={json}
			rows={14}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<div class="flex flex-col gap-3">
		{#if !result.valid && result.error}
			<Alert variant="danger" title="Error">{result.error}</Alert>
		{/if}

		<Field id="json-to-yaml-output" label="YAML output">
			<Textarea
				id="json-to-yaml-output"
				value={result.yaml}
				rows={14}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
