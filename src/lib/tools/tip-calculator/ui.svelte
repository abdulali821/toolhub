<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareNumber } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { tipCalculator, run } from './index';

	const shareKeys = tipCalculator.share!.params;
	const DEFAULT_BILL = 50;
	const DEFAULT_TIP_PERCENT = 15;
	const DEFAULT_PEOPLE = 1;

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		return {
			bill: readShareNumber(sp, 'bill', DEFAULT_BILL),
			tipPercent: readShareNumber(sp, 'tipPercent', DEFAULT_TIP_PERCENT),
			people: readShareNumber(sp, 'people', DEFAULT_PEOPLE)
		};
	}

	const initial = optionsFromUrl();
	let bill = $state(initial.bill);
	let tipPercent = $state(initial.tipPercent);
	let people = $state(initial.people);

	let output = $derived(
		run({ bill: Number(bill), tipPercent: Number(tipPercent), people: Math.trunc(Number(people)) })
	);

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			if (next.bill !== Number(bill)) bill = next.bill;
			if (next.tipPercent !== Number(tipPercent)) tipPercent = next.tipPercent;
			if (next.people !== Number(people)) people = next.people;
		});
	});

	$effect(() => {
		syncShareParams({ bill, tipPercent, people }, shareKeys, {
			defaults: {
				bill: String(DEFAULT_BILL),
				tipPercent: String(DEFAULT_TIP_PERCENT),
				people: String(DEFAULT_PEOPLE)
			}
		});
	});

	$effect(() => {
		const summary = output.error
			? ''
			: `Tip: ${output.tipAmount.toFixed(2)}\nTotal: ${output.total.toFixed(2)}\nPer person: ${output.perPerson.toFixed(2)}`;
		setToolShellActions({
			copyValue: summary,
			onReset: () => {
				bill = DEFAULT_BILL;
				tipPercent = DEFAULT_TIP_PERCENT;
				people = DEFAULT_PEOPLE;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="tc-bill" label="Bill amount">
		<Input id="tc-bill" type="number" min="0" step="0.01" bind:value={bill} />
	</Field>

	<Field id="tc-tip" label="Tip percent" hint="Default 15%">
		<Input id="tc-tip" type="number" min="0" step="1" bind:value={tipPercent} />
	</Field>

	<Field id="tc-people" label="Number of people">
		<Input id="tc-people" type="number" min="1" step="1" bind:value={people} />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<div class="grid gap-3 rounded-md border border-border bg-bg-elevated p-4 sm:grid-cols-2">
			<div>
				<p class="text-sm text-muted">Tip amount</p>
				<p class="text-xl font-semibold text-fg">{output.tipAmount.toFixed(2)}</p>
			</div>
			<div>
				<p class="text-sm text-muted">Total (bill + tip)</p>
				<p class="text-xl font-semibold text-fg">{output.total.toFixed(2)}</p>
			</div>
			<div>
				<p class="text-sm text-muted">Per person</p>
				<p class="text-xl font-semibold text-fg">{output.perPerson.toFixed(2)}</p>
			</div>
			<div>
				<p class="text-sm text-muted">Tip per person</p>
				<p class="text-xl font-semibold text-fg">{output.tipPerPerson.toFixed(2)}</p>
			</div>
		</div>
	{/if}
</div>
