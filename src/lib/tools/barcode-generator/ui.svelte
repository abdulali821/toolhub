<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Button, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import {
		BARCODE_FORMATS,
		barcodeGenerator,
		run,
		type BarcodeFormat,
		type BarcodeGeneratorInput
	} from './index';

	const shareKeys = barcodeGenerator.share!.params;
	const DEFAULT_VALUE = 'HeyTools';
	const DEFAULT_FORMAT: BarcodeFormat = 'CODE128';
	const DEFAULT_HEIGHT = 80;
	const DEFAULT_BAR_WIDTH = 2;
	const DEFAULT_DISPLAY_VALUE = true;

	const FORMAT_HINTS: Record<BarcodeFormat, string> = {
		CODE128: 'Any ASCII text',
		CODE39: 'A–Z, 0–9, and - . $ / + % space',
		EAN13: '12 or 13 digits',
		EAN8: '7 or 8 digits',
		UPC: '11 or 12 digits',
		ITF14: '13 or 14 digits',
		codabar: 'Digits with A–D start/stop',
		MSI: 'Digits only'
	};

	function parseFormat(raw: string | null): BarcodeFormat {
		return (BARCODE_FORMATS as readonly string[]).includes(raw ?? '')
			? (raw as BarcodeFormat)
			: DEFAULT_FORMAT;
	}

	function parseDisplayValue(raw: string | null): boolean {
		if (raw === '0' || raw === 'false') return false;
		if (raw === '1' || raw === 'true') return true;
		return DEFAULT_DISPLAY_VALUE;
	}

	function optionsFromUrl(): BarcodeGeneratorInput {
		const sp = page.url.searchParams;
		return {
			value: readShareParam(sp, 'value') ?? DEFAULT_VALUE,
			format: parseFormat(readShareParam(sp, 'format')),
			height: readShareNumber(sp, 'height', DEFAULT_HEIGHT),
			barWidth: readShareNumber(sp, 'barWidth', DEFAULT_BAR_WIDTH),
			displayValue: parseDisplayValue(readShareParam(sp, 'displayValue'))
		};
	}

	const initial = optionsFromUrl();
	let value = $state(initial.value);
	let format = $state<BarcodeFormat>(initial.format);
	let height = $state(initial.height);
	let barWidth = $state(initial.barWidth);
	let displayValue = $state(initial.displayValue);
	let dataUrl = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function generate(
		opts: BarcodeGeneratorInput = {
			value,
			format,
			height: Number(height),
			barWidth: Number(barWidth),
			displayValue
		}
	) {
		const safeHeight = Math.min(
			200,
			Math.max(40, Math.trunc(Number(opts.height) || DEFAULT_HEIGHT))
		);
		const safeBarWidth = Math.min(
			6,
			Math.max(1, Math.trunc(Number(opts.barWidth) || DEFAULT_BAR_WIDTH))
		);
		height = safeHeight;
		barWidth = safeBarWidth;

		if (!opts.value.trim()) {
			dataUrl = '';
			error = 'Enter a value to encode';
			return;
		}

		loading = true;
		error = null;
		try {
			const out = run({
				value: opts.value.trim(),
				format: opts.format,
				height: safeHeight,
				barWidth: safeBarWidth,
				displayValue: opts.displayValue
			});
			dataUrl = out.dataUrl;
		} catch (err) {
			dataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to generate barcode';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			let changed = false;
			if (next.value !== value) {
				value = next.value;
				changed = true;
			}
			if (next.format !== format) {
				format = next.format;
				changed = true;
			}
			if (next.height !== Number(height)) {
				height = next.height;
				changed = true;
			}
			if (next.barWidth !== Number(barWidth)) {
				barWidth = next.barWidth;
				changed = true;
			}
			if (next.displayValue !== displayValue) {
				displayValue = next.displayValue;
				changed = true;
			}
			if (changed) void generate(next);
		});
	});

	$effect(() => {
		syncShareParams({ value, format, height, barWidth, displayValue }, shareKeys, {
			defaults: {
				value: DEFAULT_VALUE,
				format: DEFAULT_FORMAT,
				height: String(DEFAULT_HEIGHT),
				barWidth: String(DEFAULT_BAR_WIDTH),
				displayValue: String(DEFAULT_DISPLAY_VALUE)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: dataUrl,
			downloadValue: dataUrl,
			downloadFilename: 'barcode.png',
			downloadMime: 'image/png',
			onReset: () => {
				value = DEFAULT_VALUE;
				format = DEFAULT_FORMAT;
				height = DEFAULT_HEIGHT;
				barWidth = DEFAULT_BAR_WIDTH;
				displayValue = DEFAULT_DISPLAY_VALUE;
				void generate({
					value: DEFAULT_VALUE,
					format: DEFAULT_FORMAT,
					height: DEFAULT_HEIGHT,
					barWidth: DEFAULT_BAR_WIDTH,
					displayValue: DEFAULT_DISPLAY_VALUE
				});
			}
		});
	});

	void generate(initial);
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="barcode-value" label="Value" required hint={FORMAT_HINTS[format]}>
		<Input id="barcode-value" bind:value type="text" autocomplete="off" />
	</Field>

	<Field id="barcode-format" label="Format">
		<select
			id="barcode-format"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			bind:value={format}
		>
			<option value="CODE128">CODE128</option>
			<option value="CODE39">CODE39</option>
			<option value="EAN13">EAN-13</option>
			<option value="EAN8">EAN-8</option>
			<option value="UPC">UPC-A</option>
			<option value="ITF14">ITF-14</option>
			<option value="codabar">Codabar</option>
			<option value="MSI">MSI</option>
		</select>
	</Field>

	<div class="grid grid-cols-2 gap-4">
		<Field id="barcode-height" label="Height (px)" hint="40–200">
			<Input id="barcode-height" type="number" min="40" max="200" bind:value={height} />
		</Field>
		<Field id="barcode-bar-width" label="Bar width" hint="1–6">
			<Input id="barcode-bar-width" type="number" min="1" max="6" bind:value={barWidth} />
		</Field>
	</div>

	<label class="flex items-center gap-2 text-sm text-fg">
		<input type="checkbox" class="size-4 rounded border-border" bind:checked={displayValue} />
		Show human-readable text under barcode
	</label>

	<Button type="button" onclick={() => generate()} disabled={loading}>
		{loading ? 'Generating…' : 'Generate barcode'}
	</Button>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if dataUrl}
		<div class="flex flex-col items-start gap-3">
			<img
				src={dataUrl}
				alt="Generated {format} barcode"
				class="max-w-full rounded-md border border-border bg-white p-3"
			/>
		</div>
	{/if}
</div>
