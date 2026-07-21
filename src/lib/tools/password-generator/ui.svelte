<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Button, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareBool, readShareNumber } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { passwordGenerator, run } from './index';

	const shareKeys = passwordGenerator.share!.params;

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		return {
			length: readShareNumber(sp, 'length', 16),
			uppercase: readShareBool(sp, 'uppercase', true),
			lowercase: readShareBool(sp, 'lowercase', true),
			numbers: readShareBool(sp, 'numbers', true),
			symbols: readShareBool(sp, 'symbols', false)
		};
	}

	const initial = optionsFromUrl();
	let length = $state(initial.length);
	let uppercase = $state(initial.uppercase);
	let lowercase = $state(initial.lowercase);
	let numbers = $state(initial.numbers);
	let symbols = $state(initial.symbols);
	let password = $state(run(initial).password);

	function generate() {
		const safeLength = Math.min(128, Math.max(4, Number(length) || 16));
		length = safeLength;
		password = run({ length: safeLength, uppercase, lowercase, numbers, symbols }).password;
	}

	// Apply URL changes from presets / reset / browser history.
	// Local state reads are untracked so editing options never re-triggers this effect.
	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			let changed = false;
			if (next.length !== Number(length)) {
				length = next.length;
				changed = true;
			}
			if (next.uppercase !== uppercase) {
				uppercase = next.uppercase;
				changed = true;
			}
			if (next.lowercase !== lowercase) {
				lowercase = next.lowercase;
				changed = true;
			}
			if (next.numbers !== numbers) {
				numbers = next.numbers;
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
		syncShareParams({ length, uppercase, lowercase, numbers, symbols }, shareKeys, {
			defaults: {
				length: '16',
				uppercase: 'true',
				lowercase: 'true',
				numbers: 'true',
				symbols: 'false'
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: password,
			onReset: () => {
				length = 16;
				uppercase = true;
				lowercase = true;
				numbers = true;
				symbols = false;
				generate();
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="pw-output" label="Password">
		<Input id="pw-output" value={password} readonly class="font-mono" />
	</Field>

	<Field id="pw-length" label="Length" hint="4–128">
		<Input id="pw-length" type="number" min="4" max="128" bind:value={length} />
	</Field>

	<fieldset class="space-y-2">
		<legend class="text-sm font-medium">Character sets</legend>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={uppercase} />
			Uppercase (A–Z)
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={lowercase} />
			Lowercase (a–z)
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={numbers} />
			Numbers (0–9)
		</label>
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={symbols} />
			Symbols
		</label>
	</fieldset>

	{#if !uppercase && !lowercase && !numbers && !symbols}
		<Alert variant="warning" title="Select a character set">
			Enable at least one option to generate a password.
		</Alert>
	{/if}

	<Button type="button" onclick={generate}>Generate new password</Button>
</div>
