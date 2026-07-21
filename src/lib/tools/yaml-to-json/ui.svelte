<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { yamlToJson, run } from './index';

	const shareKeys = yamlToJson.share!.params;
	const maxParamBytes = yamlToJson.share!.maxParamBytes;
	const DEFAULT_YAML = 'hello: world\nitems:\n  - 1\n  - 2\n  - 3';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			yaml: readShareParam(sp, 'yaml') ?? DEFAULT_YAML
		};
	}

	const initial = fromUrl();
	let yaml = $state(initial.yaml);
	let result = $derived(run({ yaml }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.yaml !== yaml) yaml = next.yaml;
		});
	});

	$effect(() => {
		pushShareState({ yaml }, shareKeys, {
			maxParamBytes,
			defaults: { yaml: DEFAULT_YAML }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result.valid ? result.json : '',
			downloadValue: result.valid ? result.json : '',
			downloadFilename: 'converted.json',
			downloadMime: 'application/json;charset=utf-8',
			onReset: () => {
				yaml = DEFAULT_YAML;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="yaml-to-json-input" label="YAML input" required>
		<Textarea
			id="yaml-to-json-input"
			bind:value={yaml}
			rows={14}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<div class="flex flex-col gap-3">
		{#if !result.valid && result.error}
			<Alert variant="danger" title="Error">{result.error}</Alert>
		{/if}

		<Field id="yaml-to-json-output" label="JSON output">
			<Textarea
				id="yaml-to-json-output"
				value={result.json}
				rows={14}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
