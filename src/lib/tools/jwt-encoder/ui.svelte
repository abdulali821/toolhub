<script lang="ts">
	import { Alert, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		run,
		DEFAULT_HEADER_JSON,
		DEFAULT_PAYLOAD_JSON,
		DEFAULT_SECRET,
		type JwtEncoderInput
	} from './index';

	type Algorithm = JwtEncoderInput['algorithm'];
	const DEFAULT_ALGORITHM: Algorithm = 'HS256';

	let headerJson = $state(DEFAULT_HEADER_JSON);
	let payloadJson = $state(DEFAULT_PAYLOAD_JSON);
	let secret = $state(DEFAULT_SECRET);
	let algorithm = $state<Algorithm>(DEFAULT_ALGORITHM);
	let token = $state('');
	let error = $state<string | undefined>(undefined);

	$effect(() => {
		const currentHeader = headerJson;
		const currentPayload = payloadJson;
		const currentSecret = secret;
		const currentAlgorithm = algorithm;
		let cancelled = false;

		run({
			headerJson: currentHeader,
			payloadJson: currentPayload,
			secret: currentSecret,
			algorithm: currentAlgorithm
		}).then((out) => {
			if (cancelled) return;
			token = out.token;
			error = out.error;
		});

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		setToolShellActions({
			copyValue: error ? '' : token,
			onReset: () => {
				headerJson = DEFAULT_HEADER_JSON;
				payloadJson = DEFAULT_PAYLOAD_JSON;
				secret = DEFAULT_SECRET;
				algorithm = DEFAULT_ALGORITHM;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="jwte-header" label="Header (JSON)">
			<Textarea id="jwte-header" bind:value={headerJson} rows={4} class="font-mono text-sm" />
		</Field>
		<Field id="jwte-payload" label="Payload (JSON)">
			<Textarea id="jwte-payload" bind:value={payloadJson} rows={4} class="font-mono text-sm" />
		</Field>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="jwte-algorithm" label="Algorithm">
			<select
				id="jwte-algorithm"
				class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={algorithm}
			>
				<option value="HS256">HS256 (HMAC-SHA256)</option>
				<option value="none">none (unsigned)</option>
			</select>
		</Field>
		<Field
			id="jwte-secret"
			label="Secret"
			hint={algorithm === 'none' ? 'Not used for "none"' : undefined}
		>
			<Input
				id="jwte-secret"
				bind:value={secret}
				disabled={algorithm === 'none'}
				class="font-mono"
			/>
		</Field>
	</div>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{:else}
		<Field id="jwte-token" label="Signed token">
			<Textarea id="jwte-token" value={token} rows={4} readonly class="font-mono text-sm" />
		</Field>
	{/if}

	<Alert variant="warning" title="Local only">
		Signing happens entirely in your browser via the Web Crypto API. Avoid pasting real production
		secrets into any browser tool.
	</Alert>
</div>
