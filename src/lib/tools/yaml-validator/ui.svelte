<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		readShareParam,
		urlSearchParams
	} from '$engine/tool-share';
	import { yamlValidator, run } from './index';

	const shareKeys = yamlValidator.share!.params;
	const maxParamBytes = yamlValidator.share!.maxParamBytes;
	const DEFAULT_YAML = 'hello: world\nitems:\n  - one\n  - two';

	function fromUrl() {
		const sp = urlSearchParams();
		return { yaml: readShareParam(sp, 'yaml') ?? DEFAULT_YAML };
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
			copyValue: result.valid ? result.message : (result.error ?? result.message),
			onReset: () => {
				yaml = DEFAULT_YAML;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="yaml-validator-input" label="YAML input" required>
		<Textarea
			id="yaml-validator-input"
			bind:value={yaml}
			rows={14}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<div class="flex flex-col gap-3">
		{#if result.valid}
			<Alert variant="success" title="Valid YAML">{result.message}</Alert>
		{:else}
			<Alert variant="danger" title="Invalid YAML">{result.error}</Alert>
		{/if}

		<Field id="yaml-validator-output" label="Result">
			<Textarea
				id="yaml-validator-output"
				value={result.valid ? result.message : (result.error ?? '')}
				rows={6}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
