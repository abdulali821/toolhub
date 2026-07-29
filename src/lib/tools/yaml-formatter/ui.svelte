<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		readShareNumber,
		readShareParam,
		urlSearchParams
	} from '$engine/tool-share';
	import { yamlFormatter, run } from './index';

	const shareKeys = yamlFormatter.share!.params;
	const maxParamBytes = yamlFormatter.share!.maxParamBytes;
	const DEFAULT_YAML = 'hello: world\nitems:\n  - one\n  - two';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			yaml: readShareParam(sp, 'yaml') ?? DEFAULT_YAML,
			indent: readShareNumber(sp, 'indent', 2)
		};
	}

	const initial = fromUrl();
	let yaml = $state(initial.yaml);
	let indent = $state(initial.indent);
	let result = $derived(run({ yaml, indent: Number(indent) }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.yaml !== yaml) yaml = next.yaml;
			if (next.indent !== Number(indent)) indent = next.indent;
		});
	});

	$effect(() => {
		pushShareState({ yaml, indent }, shareKeys, {
			maxParamBytes,
			defaults: { yaml: DEFAULT_YAML, indent: '2' }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result.valid ? result.formatted : '',
			downloadValue: result.valid ? result.formatted : '',
			downloadFilename: 'formatted.yaml',
			downloadMime: 'text/yaml;charset=utf-8',
			onReset: () => {
				yaml = DEFAULT_YAML;
				indent = 2;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="yaml-input" label="YAML input" required>
		<Textarea
			id="yaml-input"
			bind:value={yaml}
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
				class="h-10 rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={indent}
			>
				<option value={0}>Compact</option>
				<option value={2}>2 spaces</option>
				<option value={4}>4 spaces</option>
			</select>
		</div>

		{#if !result.valid && result.error}
			<Alert variant="danger" title="Invalid YAML">{result.error}</Alert>
		{:else}
			<Alert variant="success" title="Valid YAML">Formatted successfully.</Alert>
		{/if}

		<Field id="yaml-output" label="Output">
			<Textarea
				id="yaml-output"
				value={result.formatted}
				rows={12}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
