<script lang="ts">
	import { Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam,
		readShareNumber
	} from '$engine/tool-share';
	import { aspectRatioCalculator, run, type AspectRatioCalculatorInput } from './index';

	const shareKeys = aspectRatioCalculator.share!.params;

	const DEFAULT_MODE: AspectRatioCalculatorInput['mode'] = 'simplify';
	const DEFAULT_WIDTH = 1920;
	const DEFAULT_HEIGHT = 1080;
	const DEFAULT_RATIO_W = 16;
	const DEFAULT_RATIO_H = 9;
	const DEFAULT_LOCK: AspectRatioCalculatorInput['lock'] = 'width';
	const DEFAULT_TARGET = 1280;

	const MODES = new Set<AspectRatioCalculatorInput['mode']>(['simplify', 'scale']);
	const LOCKS = new Set<AspectRatioCalculatorInput['lock']>(['width', 'height']);

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const lockRaw = readShareParam(sp, 'lock');
		return {
			mode:
				modeRaw && MODES.has(modeRaw as AspectRatioCalculatorInput['mode'])
					? (modeRaw as AspectRatioCalculatorInput['mode'])
					: DEFAULT_MODE,
			width: readShareNumber(sp, 'width', DEFAULT_WIDTH),
			height: readShareNumber(sp, 'height', DEFAULT_HEIGHT),
			ratioW: readShareNumber(sp, 'ratioW', DEFAULT_RATIO_W),
			ratioH: readShareNumber(sp, 'ratioH', DEFAULT_RATIO_H),
			lock:
				lockRaw && LOCKS.has(lockRaw as AspectRatioCalculatorInput['lock'])
					? (lockRaw as AspectRatioCalculatorInput['lock'])
					: DEFAULT_LOCK,
			target: readShareNumber(sp, 'target', DEFAULT_TARGET)
		};
	}

	const initial = fromUrl();
	let mode = $state(initial.mode);
	let width = $state(initial.width);
	let height = $state(initial.height);
	let ratioW = $state(initial.ratioW);
	let ratioH = $state(initial.ratioH);
	let lock = $state(initial.lock);
	let target = $state(initial.target);

	let output = $derived(
		run({
			mode,
			width: Number(width),
			height: Number(height),
			ratioW: Number(ratioW),
			ratioH: Number(ratioH),
			lock,
			target: Number(target)
		})
	);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.mode !== mode) mode = next.mode;
			if (next.width !== Number(width)) width = next.width;
			if (next.height !== Number(height)) height = next.height;
			if (next.ratioW !== Number(ratioW)) ratioW = next.ratioW;
			if (next.ratioH !== Number(ratioH)) ratioH = next.ratioH;
			if (next.lock !== lock) lock = next.lock;
			if (next.target !== Number(target)) target = next.target;
		});
	});

	$effect(() => {
		pushShareState({ mode, width, height, ratioW, ratioH, lock, target }, shareKeys, {
			defaults: {
				mode: DEFAULT_MODE,
				width: String(DEFAULT_WIDTH),
				height: String(DEFAULT_HEIGHT),
				ratioW: String(DEFAULT_RATIO_W),
				ratioH: String(DEFAULT_RATIO_H),
				lock: DEFAULT_LOCK,
				target: String(DEFAULT_TARGET)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error
				? ''
				: mode === 'simplify'
					? output.ratioLabel
					: `${Math.round(output.width ?? 0)}×${Math.round(output.height ?? 0)}`,
			onReset: () => {
				mode = DEFAULT_MODE;
				width = DEFAULT_WIDTH;
				height = DEFAULT_HEIGHT;
				ratioW = DEFAULT_RATIO_W;
				ratioH = DEFAULT_RATIO_H;
				lock = DEFAULT_LOCK;
				target = DEFAULT_TARGET;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="arc-mode" label="Mode">
		<select
			id="arc-mode"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
			bind:value={mode}
		>
			<option value="simplify">Simplify width × height</option>
			<option value="scale">Scale from ratio</option>
		</select>
	</Field>

	{#if mode === 'simplify'}
		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="arc-width" label="Width">
				<Input id="arc-width" type="number" min="0" step="any" bind:value={width} />
			</Field>
			<Field id="arc-height" label="Height">
				<Input id="arc-height" type="number" min="0" step="any" bind:value={height} />
			</Field>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="arc-ratio-w" label="Ratio width">
				<Input id="arc-ratio-w" type="number" min="0" step="any" bind:value={ratioW} />
			</Field>
			<Field id="arc-ratio-h" label="Ratio height">
				<Input id="arc-ratio-h" type="number" min="0" step="any" bind:value={ratioH} />
			</Field>
		</div>

		<Field id="arc-lock" label="Known dimension">
			<select
				id="arc-lock"
				class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={lock}
			>
				<option value="width">Width</option>
				<option value="height">Height</option>
			</select>
		</Field>

		<Field id="arc-target" label={lock === 'width' ? 'Target width' : 'Target height'}>
			<Input id="arc-target" type="number" min="0" step="any" bind:value={target} />
		</Field>
	{/if}

	{#if output.error}
		<p class="text-sm text-danger">{output.error}</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="arc-ratio-label" label="Simplified ratio">
				<Input id="arc-ratio-label" value={output.ratioLabel} readonly class="font-mono" />
			</Field>
			<Field id="arc-decimal" label="Decimal ratio">
				<Input
					id="arc-decimal"
					value={output.decimalRatio ? output.decimalRatio.toFixed(4) : ''}
					readonly
					class="font-mono"
				/>
			</Field>
		</div>

		{#if mode === 'scale'}
			<div class="grid gap-4 sm:grid-cols-2">
				<Field id="arc-out-width" label="Width">
					<Input
						id="arc-out-width"
						value={output.width !== null ? Math.round(output.width * 100) / 100 : ''}
						readonly
						class="font-mono"
					/>
				</Field>
				<Field id="arc-out-height" label="Height">
					<Input
						id="arc-out-height"
						value={output.height !== null ? Math.round(output.height * 100) / 100 : ''}
						readonly
						class="font-mono"
					/>
				</Field>
			</div>
		{/if}
	{/if}
</div>
