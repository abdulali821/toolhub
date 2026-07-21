<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { DEMO_JWT, run } from './index';

	let token = $state(DEMO_JWT);
	let output = $derived(run({ token }));

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.payload,
			onReset: () => {
				token = DEMO_JWT;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="jwt-input" label="JWT" required>
		<Textarea id="jwt-input" bind:value={token} rows={5} class="font-mono text-sm" />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<Field id="jwt-header" label="Header">
			<Textarea id="jwt-header" value={output.header} rows={6} readonly class="font-mono text-sm" />
			<div class="mt-2">
				<CopyButton value={output.header} label="Copy header" />
			</div>
		</Field>
		<Field id="jwt-payload" label="Payload">
			<Textarea
				id="jwt-payload"
				value={output.payload}
				rows={8}
				readonly
				class="font-mono text-sm"
			/>
			<div class="mt-2">
				<CopyButton value={output.payload} label="Copy payload" />
			</div>
		</Field>
	{/if}
</div>
