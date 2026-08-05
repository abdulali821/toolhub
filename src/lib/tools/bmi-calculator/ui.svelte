<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { bmiCalculator, run, type BmiCalculatorInput, type BmiCategory } from './index';

	const shareKeys = bmiCalculator.share!.params;
	const DEFAULT_UNIT: BmiCalculatorInput['unit'] = 'metric';
	const DEFAULT_WEIGHT_METRIC = 70;
	const DEFAULT_HEIGHT_METRIC = 175;
	const DEFAULT_WEIGHT_IMPERIAL = 154;
	const DEFAULT_HEIGHT_IMPERIAL = 69;

	const CATEGORY_LABEL: Record<BmiCategory, string> = {
		underweight: 'Underweight',
		normal: 'Normal',
		overweight: 'Overweight',
		obese: 'Obese'
	};

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		const unitRaw = readShareParam(sp, 'unit');
		const unit: BmiCalculatorInput['unit'] = unitRaw === 'imperial' ? 'imperial' : DEFAULT_UNIT;
		return {
			unit,
			weight: readShareNumber(
				sp,
				'weight',
				unit === 'metric' ? DEFAULT_WEIGHT_METRIC : DEFAULT_WEIGHT_IMPERIAL
			),
			height: readShareNumber(
				sp,
				'height',
				unit === 'metric' ? DEFAULT_HEIGHT_METRIC : DEFAULT_HEIGHT_IMPERIAL
			)
		};
	}

	const initial = optionsFromUrl();
	let unit = $state<BmiCalculatorInput['unit']>(initial.unit);
	let weight = $state(initial.weight);
	let height = $state(initial.height);

	let output = $derived(run({ unit, weight: Number(weight), height: Number(height) }));

	function onUnitChange(next: BmiCalculatorInput['unit']) {
		unit = next;
		weight = next === 'metric' ? DEFAULT_WEIGHT_METRIC : DEFAULT_WEIGHT_IMPERIAL;
		height = next === 'metric' ? DEFAULT_HEIGHT_METRIC : DEFAULT_HEIGHT_IMPERIAL;
	}

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			if (next.unit !== unit) unit = next.unit;
			if (next.weight !== Number(weight)) weight = next.weight;
			if (next.height !== Number(height)) height = next.height;
		});
	});

	$effect(() => {
		syncShareParams({ unit, weight, height }, shareKeys, {
			defaults: {
				unit: DEFAULT_UNIT,
				weight: String(unit === 'metric' ? DEFAULT_WEIGHT_METRIC : DEFAULT_WEIGHT_IMPERIAL),
				height: String(unit === 'metric' ? DEFAULT_HEIGHT_METRIC : DEFAULT_HEIGHT_IMPERIAL)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue:
				output.error || !output.category
					? ''
					: `BMI: ${output.bmi} (${CATEGORY_LABEL[output.category]})`,
			onReset: () => onUnitChange(DEFAULT_UNIT)
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="bmi-unit" label="Units">
		<select
			id="bmi-unit"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			value={unit}
			onchange={(e) =>
				onUnitChange((e.currentTarget as HTMLSelectElement).value as BmiCalculatorInput['unit'])}
		>
			<option value="metric">Metric (kg, cm)</option>
			<option value="imperial">Imperial (lb, in)</option>
		</select>
	</Field>

	<Field id="bmi-weight" label={unit === 'metric' ? 'Weight (kg)' : 'Weight (lb)'}>
		<Input id="bmi-weight" type="number" min="0" step="0.1" bind:value={weight} />
	</Field>

	<Field id="bmi-height" label={unit === 'metric' ? 'Height (cm)' : 'Height (in)'}>
		<Input id="bmi-height" type="number" min="0" step="0.1" bind:value={height} />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else if output.category}
		<div class="rounded-md border border-border bg-bg-elevated p-4">
			<p class="text-sm text-muted">Your BMI</p>
			<p class="text-2xl font-semibold text-fg">{output.bmi}</p>
			<p class="mt-1 text-sm font-medium text-fg">{CATEGORY_LABEL[output.category]}</p>
		</div>
	{/if}

	<Alert variant="info" title="Not medical advice">
		BMI is a general screening measure and does not account for muscle mass, bone density, age, or
		sex. Consult a healthcare professional for personalized guidance.
	</Alert>
</div>
