<script lang="ts">
	import { Alert, Button, Field, Input } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { timestampConverter, run, type TimestampInput } from './index';

	const shareKeys = timestampConverter.share!.params;
	const DEFAULT_VALUE = String(Math.floor(Date.now() / 1000));
	const DEFAULT_MODE: TimestampInput['mode'] = 'unix-to-date';
	const MODES = new Set<TimestampInput['mode']>(['unix-to-date', 'date-to-unix', 'now']);

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode =
			modeRaw && MODES.has(modeRaw as TimestampInput['mode'])
				? (modeRaw as TimestampInput['mode'])
				: DEFAULT_MODE;
		return {
			value: readShareParam(sp, 'value') ?? DEFAULT_VALUE,
			mode
		};
	}

	const initial = fromUrl();
	let value = $state(initial.value);
	let mode = $state<TimestampInput['mode']>(initial.mode);
	let output = $derived(run({ value, mode }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.value !== value) value = next.value;
			if (next.mode !== mode) mode = next.mode;
		});
	});

	$effect(() => {
		pushShareState({ value, mode }, shareKeys, {
			defaults: { value: DEFAULT_VALUE, mode: DEFAULT_MODE }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.iso || String(output.unix),
			onReset: () => {
				value = DEFAULT_VALUE;
				mode = DEFAULT_MODE;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="ts-mode" label="Mode">
		<select
			id="ts-mode"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={mode}
		>
			<option value="unix-to-date">Unix → Date</option>
			<option value="date-to-unix">Date → Unix</option>
			<option value="now">Current time</option>
		</select>
	</Field>

	{#if mode !== 'now'}
		<Field id="ts-input" label={mode === 'unix-to-date' ? 'Unix timestamp' : 'Date string / ISO'}>
			<Input id="ts-input" bind:value class="font-mono" />
		</Field>
	{/if}

	<div class="flex gap-2">
		<Button
			type="button"
			variant="secondary"
			size="sm"
			onclick={() => {
				mode = 'now';
				value = String(Math.floor(Date.now() / 1000));
			}}>Use now</Button
		>
	</div>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<Field id="ts-unix" label="Unix (seconds)">
			<div class="flex gap-2">
				<Input id="ts-unix" value={String(output.unix)} readonly class="font-mono" />
				<CopyButton value={String(output.unix)} />
			</div>
		</Field>
		<Field id="ts-iso" label="ISO">
			<div class="flex gap-2">
				<Input id="ts-iso" value={output.iso} readonly class="font-mono" />
				<CopyButton value={output.iso} />
			</div>
		</Field>
		<p class="text-sm text-muted">Local: {output.locale}</p>
	{/if}
</div>
