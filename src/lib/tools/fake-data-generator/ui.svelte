<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Button, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { fakeDataGenerator, run, type FakeDataGeneratorInput } from './index';

	const shareKeys = fakeDataGenerator.share!.params;
	const DEFAULT_MODE: FakeDataGeneratorInput['mode'] = 'users';
	const DEFAULT_COUNT = 5;

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		const modeRaw = readShareParam(sp, 'mode');
		const mode: FakeDataGeneratorInput['mode'] = modeRaw === 'json' ? 'json' : DEFAULT_MODE;
		const seedRaw = readShareParam(sp, 'seed');
		const seed = seedRaw != null && seedRaw !== '' ? Number(seedRaw) : undefined;
		return {
			mode,
			count: readShareNumber(sp, 'count', DEFAULT_COUNT),
			seed: Number.isFinite(seed) ? Math.trunc(seed!) : undefined
		};
	}

	const initial = optionsFromUrl();
	let mode = $state<FakeDataGeneratorInput['mode']>(initial.mode);
	let count = $state(initial.count);
	let seed = $state<number | ''>(initial.seed ?? '');
	let output = $state(run(initial).text);

	function generate() {
		const safeCount = Math.min(100, Math.max(1, Number(count) || DEFAULT_COUNT));
		count = safeCount;
		const seedValue = seed === '' ? undefined : Math.trunc(Number(seed));
		output = run({ mode, count: safeCount, seed: seedValue }).text;
	}

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			let changed = false;
			if (next.mode !== mode) {
				mode = next.mode;
				changed = true;
			}
			if (next.count !== Number(count)) {
				count = next.count;
				changed = true;
			}
			const currentSeed = seed === '' ? undefined : Math.trunc(Number(seed));
			if (next.seed !== currentSeed) {
				seed = next.seed ?? '';
				changed = true;
			}
			if (changed) generate();
		});
	});

	$effect(() => {
		syncShareParams(
			{
				mode,
				count,
				seed: seed === '' ? undefined : Math.trunc(Number(seed))
			},
			shareKeys,
			{
				defaults: { mode: DEFAULT_MODE, count: String(DEFAULT_COUNT) }
			}
		);
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output,
			downloadValue: output,
			downloadFilename: mode === 'json' ? 'fake-data.json' : 'fake-users.txt',
			downloadMime: mode === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
			onReset: () => {
				mode = DEFAULT_MODE;
				count = DEFAULT_COUNT;
				seed = '';
				generate();
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="fd-mode" label="Mode">
		<select
			id="fd-mode"
			class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
			bind:value={mode}
		>
			<option value="users">Fake users (name, email, phone, address)</option>
			<option value="json">Fake JSON object array</option>
		</select>
	</Field>

	<Field id="fd-count" label="How many?" hint="1–100">
		<Input id="fd-count" type="number" min="1" max="100" bind:value={count} />
	</Field>

	<Field id="fd-seed" label="Seed (optional)" hint="Same seed → same data">
		<Input id="fd-seed" type="number" bind:value={seed} placeholder="Random if empty" />
	</Field>

	<Button type="button" onclick={generate}>Generate</Button>

	<Field id="fd-output" label="Output">
		<Textarea id="fd-output" value={output} rows={14} readonly class="font-mono text-xs" />
	</Field>
</div>
