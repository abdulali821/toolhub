<script lang="ts">
	import { Alert, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareNumber
	} from '$engine/tool-share';
	import { nanoidGenerator, run, ALPHABET_PRESETS, URL_SAFE_ALPHABET } from './index';

	const shareKeys = nanoidGenerator.share!.params;
	const DEFAULT_SIZE = 21;
	const DEFAULT_COUNT = 1;

	type PresetKey = keyof typeof ALPHABET_PRESETS | 'custom';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			size: Math.min(64, Math.max(8, Math.trunc(readShareNumber(sp, 'size', DEFAULT_SIZE)))),
			count: Math.min(50, Math.max(1, Math.trunc(readShareNumber(sp, 'count', DEFAULT_COUNT))))
		};
	}

	const initial = fromUrl();
	let size = $state(initial.size);
	let count = $state(initial.count);
	let alphabet = $state(URL_SAFE_ALPHABET);
	let preset = $state<PresetKey>('url-safe');

	let output = $derived(run({ size: Number(size), alphabet, count: Number(count) }));

	function selectPreset(next: PresetKey) {
		preset = next;
		if (next !== 'custom') alphabet = ALPHABET_PRESETS[next];
	}

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.size !== Number(size)) size = next.size;
			if (next.count !== Number(count)) count = next.count;
		});
	});

	$effect(() => {
		pushShareState({ size, count }, shareKeys, {
			defaults: { size: String(DEFAULT_SIZE), count: String(DEFAULT_COUNT) }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.joined,
			downloadValue: output.error ? '' : output.joined,
			downloadFilename: 'nanoids.txt',
			onReset: () => {
				size = DEFAULT_SIZE;
				count = DEFAULT_COUNT;
				selectPreset('url-safe');
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="ng-size" label="Size" hint="8–64 characters">
			<Input id="ng-size" type="number" min="8" max="64" bind:value={size} />
		</Field>
		<Field id="ng-count" label="Count" hint="1–50 IDs">
			<Input id="ng-count" type="number" min="1" max="50" bind:value={count} />
		</Field>
	</div>

	<Field id="ng-preset" label="Alphabet">
		<select
			id="ng-preset"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			value={preset}
			onchange={(e) => selectPreset((e.currentTarget as HTMLSelectElement).value as PresetKey)}
		>
			<option value="url-safe">URL-safe (A-Za-z0-9_-)</option>
			<option value="alphanumeric">Alphanumeric (A-Za-z0-9)</option>
			<option value="lowercase">Lowercase + digits</option>
			<option value="uppercase">Uppercase + digits</option>
			<option value="numeric">Numeric (0-9)</option>
			<option value="hex">Hex (0-9a-f)</option>
			<option value="custom">Custom</option>
		</select>
	</Field>

	{#if preset === 'custom'}
		<Field id="ng-alphabet" label="Custom alphabet" hint="Duplicate characters are ignored">
			<Input
				id="ng-alphabet"
				bind:value={alphabet}
				class="font-mono"
				oninput={() => (preset = 'custom')}
			/>
		</Field>
	{/if}

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<Field id="ng-output" label="Generated IDs">
			<Textarea
				id="ng-output"
				value={output.joined}
				rows={Math.min(12, Math.max(4, output.ids.length))}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	{/if}
</div>
