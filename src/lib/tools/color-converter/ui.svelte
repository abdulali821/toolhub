<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Field, Input } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { colorConverter, run } from './index';

	const shareKeys = colorConverter.share!.params;
	const DEFAULT_HEX = '#0f766e';

	function valueFromUrl() {
		const raw = readShareParam(page.url.searchParams, 'hex');
		if (!raw) return DEFAULT_HEX;
		return raw.startsWith('#') ? raw : `#${raw}`;
	}

	let value = $state(valueFromUrl());
	let output = $derived(run({ value }));

	// Apply URL changes from presets / reset / browser history.
	// Local state reads are untracked so typing never re-triggers this effect.
	// Skip when the URL hex is just the normalized form of what's being typed
	// (e.g. "#ff0" vs "#ffff00") so we don't rewrite the input mid-edit.
	$effect(() => {
		const next = valueFromUrl();
		untrack(() => {
			if (next.toLowerCase() === value.toLowerCase()) return;
			const nextHex = run({ value: next }).hex;
			if (nextHex && nextHex === output.hex) return;
			value = next;
		});
	});

	$effect(() => {
		const hex = (output.hex || value).replace(/^#/, '');
		syncShareParams({ hex }, shareKeys, {
			defaults: { hex: DEFAULT_HEX.replace(/^#/, '') }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.hex,
			onReset: () => {
				value = DEFAULT_HEX;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="color-input" label="Color" hint="HEX or rgb()">
		<div class="flex gap-2">
			<input
				type="color"
				class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
				value={output.hex || '#000000'}
				oninput={(e) => {
					value = (e.currentTarget as HTMLInputElement).value;
				}}
				aria-label="Pick color"
			/>
			<Input id="color-input" bind:value class="font-mono" />
		</div>
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<div
			class="h-16 rounded-md border border-border"
			style={`background:${output.hex}`}
			aria-hidden="true"
		></div>
		<Field id="color-hex" label="HEX">
			<div class="flex gap-2">
				<Input id="color-hex" value={output.hex} readonly class="font-mono" />
				<CopyButton value={output.hex} />
			</div>
		</Field>
		<Field id="color-rgb" label="RGB">
			<div class="flex gap-2">
				<Input id="color-rgb" value={output.rgb} readonly class="font-mono" />
				<CopyButton value={output.rgb} />
			</div>
		</Field>
		<Field id="color-hsl" label="HSL">
			<div class="flex gap-2">
				<Input id="color-hsl" value={output.hsl} readonly class="font-mono" />
				<CopyButton value={output.hsl} />
			</div>
		</Field>
	{/if}
</div>
