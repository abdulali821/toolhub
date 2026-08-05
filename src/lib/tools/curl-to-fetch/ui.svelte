<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { curlToFetch, run, type CurlToFetchInput } from './index';

	const shareKeys = curlToFetch.share!.params;
	type Target = CurlToFetchInput['target'];
	const TARGETS = new Set<Target>(['fetch', 'axios']);
	const DEFAULT_TARGET: Target = 'fetch';
	const DEFAULT_CURL = '';

	function fromUrl() {
		const sp = urlSearchParams();
		const targetRaw = readShareParam(sp, 'target');
		const target = TARGETS.has(targetRaw as Target) ? (targetRaw as Target) : DEFAULT_TARGET;
		// `curl` is applied from preset clicks but never persisted (see share.params).
		return { curl: readShareParam(sp, 'curl'), target };
	}

	const initial = fromUrl();
	let curl = $state(initial.curl ?? DEFAULT_CURL);
	let target = $state<Target>(initial.target);

	let output = $derived(curl.trim() ? run({ curl, target }) : null);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.curl != null && next.curl !== curl) curl = next.curl;
			if (next.target !== target) target = next.target;
		});
	});

	$effect(() => {
		pushShareState({ target }, shareKeys, { defaults: { target: DEFAULT_TARGET } });
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output?.code ?? '',
			onReset: () => {
				curl = DEFAULT_CURL;
				target = DEFAULT_TARGET;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<div class="flex flex-col gap-4">
		<Field id="ctf-curl" label="curl command" required>
			<Textarea
				id="ctf-curl"
				bind:value={curl}
				rows={12}
				placeholder={`curl -X POST https://api.example.com/users \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name":"Ada"}'`}
				class="font-mono text-sm"
			/>
		</Field>

		<Field id="ctf-target" label="Target">
			<div class="flex gap-2">
				<label
					class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm {target === 'fetch'
						? 'border-accent bg-bg-elevated text-fg'
						: 'border-border text-muted'}"
				>
					<input type="radio" name="ctf-target" value="fetch" bind:group={target} />
					fetch
				</label>
				<label
					class="flex items-center gap-2 rounded-md border px-3 py-2 text-sm {target === 'axios'
						? 'border-accent bg-bg-elevated text-fg'
						: 'border-border text-muted'}"
				>
					<input type="radio" name="ctf-target" value="axios" bind:group={target} />
					Axios
				</label>
			</div>
		</Field>
	</div>

	<div class="flex flex-col gap-4">
		<Field id="ctf-output" label="JavaScript">
			<Textarea
				id="ctf-output"
				value={output?.code ?? ''}
				rows={16}
				readonly
				class="font-mono text-sm"
			/>
		</Field>

		{#if output}
			<p class="text-sm text-muted">
				<span class="font-mono font-medium text-fg">{output.method}</span>
				{output.url}
			</p>
		{/if}

		{#if output?.warnings.length}
			<Alert variant="warning" title="Heads up">
				<ul class="list-inside list-disc space-y-1">
					{#each output.warnings as warning (warning)}
						<li>{warning}</li>
					{/each}
				</ul>
			</Alert>
		{/if}
	</div>
</div>
