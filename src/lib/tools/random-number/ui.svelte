<script lang="ts">
	import { Button, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareNumber
	} from '$engine/tool-share';
	import { randomNumber, run } from './index';

	const shareKeys = randomNumber.share!.params;
	const DEFAULT_MIN = 1;
	const DEFAULT_MAX = 100;
	const DEFAULT_COUNT = 5;

	function fromUrl() {
		const sp = urlSearchParams();
		const countRaw = readShareNumber(sp, 'count', DEFAULT_COUNT);
		return {
			min: Math.trunc(readShareNumber(sp, 'min', DEFAULT_MIN)),
			max: Math.trunc(readShareNumber(sp, 'max', DEFAULT_MAX)),
			count: Math.min(100, Math.max(1, Math.trunc(countRaw) || DEFAULT_COUNT))
		};
	}

	const initial = fromUrl();
	let min = $state(initial.min);
	let max = $state(initial.max);
	let count = $state(initial.count);
	let numbers = $state<number[]>(
		run({ min: initial.min, max: initial.max, count: initial.count }).numbers
	);
	let error = $state<string | undefined>(undefined);

	function generate(next = { min, max, count }) {
		const safeCount = Math.min(100, Math.max(1, Number(next.count) || 1));
		const safeMin = Math.trunc(Number(next.min));
		const safeMax = Math.trunc(Number(next.max));
		min = Number.isFinite(safeMin) ? safeMin : DEFAULT_MIN;
		max = Number.isFinite(safeMax) ? safeMax : DEFAULT_MAX;
		count = safeCount;
		const result = run({ min, max, count });
		numbers = result.numbers;
		error = result.error;
	}

	const output = $derived(numbers.join('\n'));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.min !== Number(min) || next.max !== Number(max) || next.count !== Number(count)) {
				generate(next);
			}
		});
	});

	$effect(() => {
		pushShareState({ min, max, count }, shareKeys, {
			defaults: {
				min: String(DEFAULT_MIN),
				max: String(DEFAULT_MAX),
				count: String(DEFAULT_COUNT)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: error ? '' : output,
			onReset: () => {
				generate({ min: DEFAULT_MIN, max: DEFAULT_MAX, count: DEFAULT_COUNT });
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-3">
		<Field id="rn-min" label="Minimum">
			<Input id="rn-min" type="number" bind:value={min} />
		</Field>
		<Field id="rn-max" label="Maximum">
			<Input id="rn-max" type="number" bind:value={max} />
		</Field>
		<Field id="rn-count" label="Count" hint="1–100">
			<Input id="rn-count" type="number" min="1" max="100" bind:value={count} />
		</Field>
	</div>

	<div class="flex flex-wrap gap-2">
		<Button type="button" onclick={() => generate()}>Generate</Button>
	</div>

	{#if error}
		<p class="text-sm text-danger">{error}</p>
	{/if}

	<Field id="rn-output" label="Result">
		<Textarea
			id="rn-output"
			value={output}
			rows={Math.min(12, Math.max(4, numbers.length || 4))}
			readonly
			class="font-mono text-sm"
		/>
	</Field>
</div>
