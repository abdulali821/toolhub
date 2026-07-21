<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Field, Input } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { colorPicker, parseColorValue, run } from './index';

	const shareKeys = colorPicker.share!.params;
	const DEFAULT_HEX = '#2563eb';

	function hexFromUrl() {
		const raw = readShareParam(page.url.searchParams, 'hex');
		if (!raw) return DEFAULT_HEX;
		return raw.startsWith('#') ? raw : `#${raw}`;
	}

	let hexInput = $state(hexFromUrl());
	let output = $derived(run({ hex: hexInput }));

	function applyColor(value: string) {
		try {
			const parsed = parseColorValue(value);
			hexInput = parsed.hex;
		} catch {
			hexInput = value;
		}
	}

	$effect(() => {
		const next = hexFromUrl();
		untrack(() => {
			if (next.toLowerCase() === hexInput.toLowerCase()) return;
			applyColor(next);
		});
	});

	$effect(() => {
		const hex = (output.hex || hexInput).replace(/^#/, '');
		syncShareParams({ hex }, shareKeys, {
			defaults: { hex: DEFAULT_HEX.replace(/^#/, '') }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.hex,
			onReset: () => applyColor(DEFAULT_HEX)
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="cp-native" label="Pick color">
		<div class="flex gap-2">
			<input
				type="color"
				class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
				value={output.hex || DEFAULT_HEX}
				oninput={(e) => applyColor((e.currentTarget as HTMLInputElement).value)}
				aria-label="Pick color"
			/>
			<Input
				id="cp-native"
				value={hexInput}
				class="font-mono"
				oninput={(e) => applyColor((e.currentTarget as HTMLInputElement).value)}
			/>
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

		<Field id="cp-hex" label="HEX">
			<div class="flex gap-2">
				<Input id="cp-hex" value={output.hex} readonly class="font-mono" />
				<CopyButton value={output.hex} />
			</div>
		</Field>

		<Field id="cp-rgb" label="RGB">
			<div class="flex gap-2">
				<Input
					id="cp-rgb"
					value={output.rgb}
					class="font-mono"
					oninput={(e) => applyColor((e.currentTarget as HTMLInputElement).value)}
				/>
				<CopyButton value={output.rgb} />
			</div>
		</Field>

		<Field id="cp-hsl" label="HSL">
			<div class="flex gap-2">
				<Input
					id="cp-hsl"
					value={output.hsl}
					class="font-mono"
					oninput={(e) => applyColor((e.currentTarget as HTMLInputElement).value)}
				/>
				<CopyButton value={output.hsl} />
			</div>
		</Field>
	{/if}
</div>
