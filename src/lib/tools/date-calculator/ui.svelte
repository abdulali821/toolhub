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
	import { dateCalculator, run, type DateCalculatorInput } from './index';

	const shareKeys = dateCalculator.share!.params;
	type Mode = DateCalculatorInput['mode'];
	type Unit = NonNullable<DateCalculatorInput['unit']>;
	const MODES = new Set<Mode>(['difference', 'age', 'add']);
	const UNITS = new Set<Unit>(['days', 'weeks', 'months', 'years']);

	const DEFAULT_MODE: Mode = 'difference';
	const DEFAULT_START = '2024-01-01';
	const DEFAULT_END = '2024-12-31';
	const DEFAULT_BIRTH = '2000-01-01';
	const DEFAULT_AMOUNT = 30;
	const DEFAULT_UNIT: Unit = 'days';

	const modeLabels: Record<Mode, string> = {
		difference: 'Difference between two dates',
		age: 'Age from birth date',
		add: 'Add to a date'
	};

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode = MODES.has(modeRaw as Mode) ? (modeRaw as Mode) : DEFAULT_MODE;
		const unitRaw = readShareParam(sp, 'unit');
		const unit = UNITS.has(unitRaw as Unit) ? (unitRaw as Unit) : DEFAULT_UNIT;
		return {
			mode,
			startDate: readShareParam(sp, 'startDate') ?? DEFAULT_START,
			endDate: readShareParam(sp, 'endDate') ?? DEFAULT_END,
			birthDate: readShareParam(sp, 'birthDate') ?? DEFAULT_BIRTH,
			amount: readShareNumber(sp, 'amount', DEFAULT_AMOUNT),
			unit
		};
	}

	const initial = fromUrl();
	let mode = $state<Mode>(initial.mode);
	let startDate = $state(initial.startDate);
	let endDate = $state(initial.endDate);
	let birthDate = $state(initial.birthDate);
	let amount = $state(initial.amount);
	let unit = $state<Unit>(initial.unit);

	const output = $derived(
		run({
			mode,
			startDate,
			endDate,
			birthDate,
			amount: Number(amount),
			unit
		})
	);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.mode !== mode) mode = next.mode;
			if (next.startDate !== startDate) startDate = next.startDate;
			if (next.endDate !== endDate) endDate = next.endDate;
			if (next.birthDate !== birthDate) birthDate = next.birthDate;
			if (next.amount !== Number(amount)) amount = next.amount;
			if (next.unit !== unit) unit = next.unit;
		});
	});

	$effect(() => {
		pushShareState({ mode, startDate, endDate, birthDate, amount, unit }, shareKeys, {
			defaults: {
				mode: DEFAULT_MODE,
				startDate: DEFAULT_START,
				endDate: DEFAULT_END,
				birthDate: DEFAULT_BIRTH,
				amount: String(DEFAULT_AMOUNT),
				unit: DEFAULT_UNIT
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.summary,
			onReset: () => {
				mode = DEFAULT_MODE;
				startDate = DEFAULT_START;
				endDate = DEFAULT_END;
				birthDate = DEFAULT_BIRTH;
				amount = DEFAULT_AMOUNT;
				unit = DEFAULT_UNIT;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="dc-mode" label="Mode">
		<select
			id="dc-mode"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			bind:value={mode}
		>
			{#each Object.entries(modeLabels) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</Field>

	{#if mode === 'difference'}
		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="dc-start" label="Start date">
				<Input id="dc-start" type="date" bind:value={startDate} />
			</Field>
			<Field id="dc-end" label="End date">
				<Input id="dc-end" type="date" bind:value={endDate} />
			</Field>
		</div>
	{:else if mode === 'age'}
		<Field id="dc-birth" label="Birth date">
			<Input id="dc-birth" type="date" bind:value={birthDate} />
		</Field>
	{:else if mode === 'add'}
		<Field id="dc-add-start" label="Start date">
			<Input id="dc-add-start" type="date" bind:value={startDate} />
		</Field>
		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="dc-amount" label="Amount">
				<Input id="dc-amount" type="number" step="1" bind:value={amount} />
			</Field>
			<Field id="dc-unit" label="Unit">
				<select
					id="dc-unit"
					class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
					bind:value={unit}
				>
					<option value="days">Days</option>
					<option value="weeks">Weeks</option>
					<option value="months">Months</option>
					<option value="years">Years</option>
				</select>
			</Field>
		</div>
	{/if}

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<Field id="dc-result" label="Result">
			<Input id="dc-result" value={output.summary} readonly class="font-mono" />
		</Field>
		{#if mode !== 'add'}
			<p class="text-sm text-muted">
				{output.totalDays} total day{output.totalDays === 1 ? '' : 's'}
				{#if output.totalWeeks != null}
					&middot; {output.totalWeeks} week{output.totalWeeks === 1 ? '' : 's'}
				{/if}
			</p>
		{/if}
	{/if}
</div>
