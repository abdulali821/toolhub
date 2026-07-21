<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Button, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareBool, readShareNumber } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { randomStringGenerator, run } from './index';

	const shareKeys = randomStringGenerator.share!.params;

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		return {
			length: readShareNumber(sp, 'length', 16),
			lowercase: readShareBool(sp, 'lowercase', true),
			uppercase: readShareBool(sp, 'uppercase', true),
			digits: readShareBool(sp, 'digits', true),
			symbols: readShareBool(sp, 'symbols', false)
		};
	}

	const initial = optionsFromUrl();
	let length = $state(initial.length);
	let lowercase = $state(initial.lowercase);
	let uppercase = $state(initial.uppercase);
	let digits = $state(initial.digits);
	let symbols = $state(initial.symbols);
	let result = $state(run(initial).result);

	function generate() {
		const safeLength = Math.min(512, Math.max(1, Number(length) || 16));
		length = safeLength;
		result = run({ length: safeLength, lowercase, uppercase, digits, symbols }).result;
	}

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			let changed = false;
			if (next.length !== Number(length)) {
				length = next.length;
				changed = true;
			}
			if (next.lowercase !== lowercase) {
				lowercase = next.lowercase;
				changed = true;
			}
			if (next.uppercase !== uppercase) {
				uppercase = next.uppercase;
				changed = true;
			}
			if (next.digits !== digits) {
				digits = next.digits;
				changed = true;
			}
			if (next.symbols !== symbols) {
				symbols = next.symbols;
				changed = true;
			}
			if (changed) generate();
		});
	});

	$effect(() => {
		syncShareParams({ length, lowercase, uppercase, digits, symbols }, shareKeys, {
			defaults: {
				length: '16',
				lowercase: 'true',
				uppercase: 'true',
				digits: 'true',
				symbols: 'false'
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result,
			onReset: () => {
				length = 16;
				lowercase = true;
				uppercase = true;
				digits = true;
				symbols = false;
				generate();
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="rs-output" label="Random string">
		<Input id="rs-output" value={result} readonly class="font-mono" />
	</Field>

	<Field id="rs-length" label="Length" hint="1–512">
		<Input id="rs-length" type="number" min="1" max="512" bind:value={length} />
	</Field>

	<fieldset class="space-y-2">
		<legend class="text-sm font-medium">Character sets</legend>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={lowercase} />
			Lowercase (a–z)
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={uppercase} />
			Uppercase (A–Z)
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={digits} />
			Digits (0–9)
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={symbols} />
			Symbols
		</label>
	</fieldset>

	{#if !lowercase && !uppercase && !digits && !symbols}
		<Alert variant="warning" title="Select a character set">
			Enable at least one option to generate a string.
		</Alert>
	{/if}

	<Button type="button" onclick={generate}>Generate new string</Button>
</div>
