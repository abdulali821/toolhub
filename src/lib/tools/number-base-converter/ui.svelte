<script lang="ts">
	import { Alert, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam,
		readShareNumber
	} from '$engine/tool-share';
	import { numberBaseConverter, run } from './index';

	const shareKeys = numberBaseConverter.share!.params;
	const DEFAULT_VALUE = '255';
	const DEFAULT_FROM = 10;
	const DEFAULT_TO = 16;

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			value: readShareParam(sp, 'value') ?? DEFAULT_VALUE,
			fromBase: readShareNumber(sp, 'fromBase', DEFAULT_FROM),
			toBase: readShareNumber(sp, 'toBase', DEFAULT_TO)
		};
	}

	const initial = fromUrl();
	let value = $state(initial.value);
	let fromBase = $state(initial.fromBase);
	let toBase = $state(initial.toBase);
	let output = $derived(run({ value, fromBase: Number(fromBase), toBase: Number(toBase) }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.value !== value) value = next.value;
			if (next.fromBase !== Number(fromBase)) fromBase = next.fromBase;
			if (next.toBase !== Number(toBase)) toBase = next.toBase;
		});
	});

	$effect(() => {
		pushShareState({ value, fromBase, toBase }, shareKeys, {
			defaults: {
				value: DEFAULT_VALUE,
				fromBase: String(DEFAULT_FROM),
				toBase: String(DEFAULT_TO)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.result,
			onReset: () => {
				value = DEFAULT_VALUE;
				fromBase = DEFAULT_FROM;
				toBase = DEFAULT_TO;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="nb-value" label="Value" required>
		<Input id="nb-value" bind:value class="font-mono" />
	</Field>
	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="nb-from" label="From base">
			<Input id="nb-from" type="number" min="2" max="36" bind:value={fromBase} />
		</Field>
		<Field id="nb-to" label="To base">
			<Input id="nb-to" type="number" min="2" max="36" bind:value={toBase} />
		</Field>
	</div>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<Field id="nb-result" label="Result">
			<Input id="nb-result" value={output.result} readonly class="font-mono" />
		</Field>
		<p class="text-sm text-muted">Decimal: {output.decimal}</p>
	{/if}
</div>
