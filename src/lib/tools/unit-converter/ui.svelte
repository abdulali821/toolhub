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
	import {
		unitConverter,
		run,
		UNIT_OPTIONS,
		type UnitConverterInput,
		type UnitCategory
	} from './index';

	const shareKeys = unitConverter.share!.params;
	const CATEGORIES: UnitCategory[] = ['length', 'weight', 'temperature', 'data-size'];
	const CATEGORY_LABELS: Record<UnitCategory, string> = {
		length: 'Length',
		weight: 'Weight',
		temperature: 'Temperature',
		'data-size': 'Data size'
	};

	const DEFAULT_CATEGORY: UnitCategory = 'length';
	const DEFAULT_FROM = 'km';
	const DEFAULT_TO = 'mi';
	const DEFAULT_VALUE = 5;

	function fromUrl() {
		const sp = urlSearchParams();
		const categoryRaw = readShareParam(sp, 'category');
		const category = CATEGORIES.includes(categoryRaw as UnitCategory)
			? (categoryRaw as UnitCategory)
			: DEFAULT_CATEGORY;
		const options = UNIT_OPTIONS[category];
		const fromRaw = readShareParam(sp, 'fromUnit');
		const toRaw = readShareParam(sp, 'toUnit');
		return {
			category,
			fromUnit: fromRaw && options.includes(fromRaw) ? fromRaw : options[0]!,
			toUnit: toRaw && options.includes(toRaw) ? toRaw : (options[1] ?? options[0]!),
			value: readShareNumber(sp, 'value', DEFAULT_VALUE)
		};
	}

	const initial = fromUrl();
	let category = $state<UnitCategory>(initial.category);
	let fromUnit = $state(initial.fromUnit);
	let toUnit = $state(initial.toUnit);
	let value = $state(initial.value);

	const options = $derived(UNIT_OPTIONS[category]);
	const output = $derived(
		run({ category, fromUnit, toUnit, value: Number(value) } as UnitConverterInput)
	);

	function onCategoryChange() {
		const next = UNIT_OPTIONS[category];
		if (!next.includes(fromUnit)) fromUnit = next[0]!;
		if (!next.includes(toUnit)) toUnit = next[1] ?? next[0]!;
	}

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.category !== category) category = next.category;
			if (next.fromUnit !== fromUnit) fromUnit = next.fromUnit;
			if (next.toUnit !== toUnit) toUnit = next.toUnit;
			if (next.value !== Number(value)) value = next.value;
		});
	});

	$effect(() => {
		pushShareState({ category, fromUnit, toUnit, value }, shareKeys, {
			defaults: {
				category: DEFAULT_CATEGORY,
				fromUnit: DEFAULT_FROM,
				toUnit: DEFAULT_TO,
				value: String(DEFAULT_VALUE)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.formatted,
			onReset: () => {
				category = DEFAULT_CATEGORY;
				fromUnit = DEFAULT_FROM;
				toUnit = DEFAULT_TO;
				value = DEFAULT_VALUE;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="uc-category" label="Category">
		<select
			id="uc-category"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			bind:value={category}
			onchange={onCategoryChange}
		>
			{#each CATEGORIES as cat (cat)}
				<option value={cat}>{CATEGORY_LABELS[cat]}</option>
			{/each}
		</select>
	</Field>

	<Field id="uc-value" label="Value">
		<Input id="uc-value" type="number" step="any" bind:value />
	</Field>

	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="uc-from" label="From">
			<select
				id="uc-from"
				class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={fromUnit}
			>
				{#each options as unit (unit)}
					<option value={unit}>{unit}</option>
				{/each}
			</select>
		</Field>
		<Field id="uc-to" label="To">
			<select
				id="uc-to"
				class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={toUnit}
			>
				{#each options as unit (unit)}
					<option value={unit}>{unit}</option>
				{/each}
			</select>
		</Field>
	</div>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<Field id="uc-result" label="Result">
			<Input id="uc-result" value={output.formatted} readonly class="font-mono" />
		</Field>
	{/if}
</div>
