<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { jsonValidator, run } from './index';

	const shareKeys = jsonValidator.share!.params;
	const maxParamBytes = jsonValidator.share!.maxParamBytes;
	const DEFAULT_JSON = '{\n  "hello": "world"\n}';

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
			copyValue: result.valid ? (result.parsedPreview ?? '') : (result.error ?? ''),
			onReset: () => {
				json = DEFAULT_JSON;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="json-validator-input" label="JSON input" required>
		<Textarea
			id="json-validator-input"
			bind:value={json}
			rows={14}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<div class="flex flex-col gap-3">
		{#if result.valid}
			<Alert variant="success" title="Valid JSON">Syntax is valid.</Alert>
		{:else}
			<Alert variant="danger" title="Invalid JSON">
				{result.error}
				{#if result.path}
					<span class="mt-1 block font-mono text-xs">Path: {result.path}</span>
				{/if}
			</Alert>
		{/if}

		{#if result.valid && result.parsedPreview}
			<Field id="json-validator-preview" label="Parsed preview">
				<Textarea
					id="json-validator-preview"
					value={result.parsedPreview}
					rows={12}
					readonly
					class="font-mono text-sm"
				/>
			</Field>
		{/if}
	</div>
</div>
