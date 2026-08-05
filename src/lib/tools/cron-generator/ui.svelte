<script lang="ts">
	import { Alert, Button, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { cronGenerator, run } from './index';

	const shareKeys = cronGenerator.share!.params;
	const DEFAULTS = {
		minute: '*',
		hour: '*',
		dayOfMonth: '*',
		month: '*',
		dayOfWeek: '*'
	};

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			minute: readShareParam(sp, 'minute') ?? DEFAULTS.minute,
			hour: readShareParam(sp, 'hour') ?? DEFAULTS.hour,
			dayOfMonth: readShareParam(sp, 'dayOfMonth') ?? DEFAULTS.dayOfMonth,
			month: readShareParam(sp, 'month') ?? DEFAULTS.month,
			dayOfWeek: readShareParam(sp, 'dayOfWeek') ?? DEFAULTS.dayOfWeek
		};
	}

	const initial = fromUrl();
	let minute = $state(initial.minute);
	let hour = $state(initial.hour);
	let dayOfMonth = $state(initial.dayOfMonth);
	let month = $state(initial.month);
	let dayOfWeek = $state(initial.dayOfWeek);

	const output = $derived(run({ minute, hour, dayOfMonth, month, dayOfWeek }));

	const presetList = [
		{
			label: 'Every minute',
			values: { minute: '*', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' }
		},
		{
			label: 'Hourly',
			values: { minute: '0', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' }
		},
		{
			label: 'Daily at noon',
			values: { minute: '0', hour: '12', dayOfMonth: '*', month: '*', dayOfWeek: '*' }
		},
		{
			label: 'Weekly, Monday 9am',
			values: { minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '1' }
		},
		{
			label: 'Monthly, 1st at midnight',
			values: { minute: '0', hour: '0', dayOfMonth: '1', month: '*', dayOfWeek: '*' }
		}
	];

	function applyPreset(values: typeof DEFAULTS) {
		minute = values.minute;
		hour = values.hour;
		dayOfMonth = values.dayOfMonth;
		month = values.month;
		dayOfWeek = values.dayOfWeek;
	}

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.minute !== minute) minute = next.minute;
			if (next.hour !== hour) hour = next.hour;
			if (next.dayOfMonth !== dayOfMonth) dayOfMonth = next.dayOfMonth;
			if (next.month !== month) month = next.month;
			if (next.dayOfWeek !== dayOfWeek) dayOfWeek = next.dayOfWeek;
		});
	});

	$effect(() => {
		pushShareState({ minute, hour, dayOfMonth, month, dayOfWeek }, shareKeys, {
			defaults: DEFAULTS
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.expression,
			onReset: () => applyPreset(DEFAULTS)
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<div class="flex flex-wrap gap-2">
		{#each presetList as preset (preset.label)}
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onclick={() => applyPreset(preset.values)}
			>
				{preset.label}
			</Button>
		{/each}
	</div>

	<div class="grid gap-4 sm:grid-cols-5">
		<Field id="cron-minute" label="Minute" hint="0-59">
			<Input id="cron-minute" bind:value={minute} class="font-mono" />
		</Field>
		<Field id="cron-hour" label="Hour" hint="0-23">
			<Input id="cron-hour" bind:value={hour} class="font-mono" />
		</Field>
		<Field id="cron-dom" label="Day" hint="1-31">
			<Input id="cron-dom" bind:value={dayOfMonth} class="font-mono" />
		</Field>
		<Field id="cron-month" label="Month" hint="1-12">
			<Input id="cron-month" bind:value={month} class="font-mono" />
		</Field>
		<Field id="cron-dow" label="Weekday" hint="0-7">
			<Input id="cron-dow" bind:value={dayOfWeek} class="font-mono" />
		</Field>
	</div>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<Field id="cron-expression" label="Cron expression">
			<Input id="cron-expression" value={output.expression} readonly class="font-mono" />
		</Field>
		<p class="text-sm text-muted">{output.explanation}</p>
	{/if}
</div>
