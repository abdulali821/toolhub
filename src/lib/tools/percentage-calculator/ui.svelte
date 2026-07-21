<script lang="ts">
	import { Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam,
		readShareNumber
	} from '$engine/tool-share';
	import { percentageCalculator, run, type PercentageCalculatorInput } from './index';

	const shareKeys = percentageCalculator.share!.params;
	const DEFAULT_MODE: PercentageCalculatorInput['mode'] = 'percent-of';
	const DEFAULT_A = 15;
	const DEFAULT_B = 200;
	const MODES = new Set<PercentageCalculatorInput['mode']>([
		'percent-of',
		'is-what-percent',
		'percent-change'
	]);

	const modeMeta: Record<
		PercentageCalculatorInput['mode'],
		{ label: string; aLabel: string; bLabel: string }
	> = {
		'percent-of': { label: 'What is X% of Y?', aLabel: 'Percent (X)', bLabel: 'Of (Y)' },
		'is-what-percent': {
			label: 'X is what % of Y?',
			aLabel: 'Value (X)',
			bLabel: 'Of (Y)'
		},
		'percent-change': {
			label: 'Percent change',
			aLabel: 'From (A)',
			bLabel: 'To (B)'
		}
	};

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode =
			modeRaw && MODES.has(modeRaw as PercentageCalculatorInput['mode'])
				? (modeRaw as PercentageCalculatorInput['mode'])
				: DEFAULT_MODE;
		return {
			mode,
			a: readShareNumber(sp, 'a', DEFAULT_A),
			b: readShareNumber(sp, 'b', DEFAULT_B)
		};
	}

	const initial = fromUrl();
	let mode = $state<PercentageCalculatorInput['mode']>(initial.mode);
	let a = $state(initial.a);
	let b = $state(initial.b);
	let output = $derived(run({ mode, a: Number(a), b: Number(b) }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.mode !== mode) mode = next.mode;
			if (next.a !== Number(a)) a = next.a;
			if (next.b !== Number(b)) b = next.b;
		});
	});

	$effect(() => {
		pushShareState({ mode, a, b }, shareKeys, {
			defaults: {
				mode: DEFAULT_MODE,
				a: String(DEFAULT_A),
				b: String(DEFAULT_B)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.formatted,
			onReset: () => {
				mode = DEFAULT_MODE;
				a = DEFAULT_A;
				b = DEFAULT_B;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="pc-mode" label="Mode">
		<select
			id="pc-mode"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={mode}
		>
			{#each Object.entries(modeMeta) as [value, meta] (value)}
				<option {value}>{meta.label}</option>
			{/each}
		</select>
	</Field>

	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="pc-a" label={modeMeta[mode].aLabel}>
			<Input id="pc-a" type="number" step="any" bind:value={a} />
		</Field>
		<Field id="pc-b" label={modeMeta[mode].bLabel}>
			<Input id="pc-b" type="number" step="any" bind:value={b} />
		</Field>
	</div>

	{#if output.error}
		<p class="text-sm text-danger">{output.error}</p>
	{:else}
		<Field id="pc-result" label={output.label || 'Result'}>
			<Input id="pc-result" value={output.formatted} readonly class="font-mono" />
		</Field>
	{/if}
</div>
