<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareBool, readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { boxShadowGenerator, run, normalizeHex } from './index';

	const shareKeys = boxShadowGenerator.share!.params;
	const DEFAULT_OFFSET_X = 0;
	const DEFAULT_OFFSET_Y = 4;
	const DEFAULT_BLUR = 12;
	const DEFAULT_SPREAD = 0;
	const DEFAULT_COLOR = '000000';
	const DEFAULT_OPACITY = 0.12;
	const DEFAULT_INSET = false;

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		return {
			offsetX: readShareNumber(sp, 'offsetX', DEFAULT_OFFSET_X),
			offsetY: readShareNumber(sp, 'offsetY', DEFAULT_OFFSET_Y),
			blur: readShareNumber(sp, 'blur', DEFAULT_BLUR),
			spread: readShareNumber(sp, 'spread', DEFAULT_SPREAD),
			color: readShareParam(sp, 'color') ?? DEFAULT_COLOR,
			opacity: readShareNumber(sp, 'opacity', DEFAULT_OPACITY),
			inset: readShareBool(sp, 'inset', DEFAULT_INSET)
		};
	}

	const initial = optionsFromUrl();
	let offsetX = $state(initial.offsetX);
	let offsetY = $state(initial.offsetY);
	let blur = $state(initial.blur);
	let spread = $state(initial.spread);
	let color = $state(initial.color);
	let opacity = $state(initial.opacity);
	let inset = $state(initial.inset);

	let output = $derived(
		run({
			offsetX: Number(offsetX),
			offsetY: Number(offsetY),
			blur: Math.max(0, Number(blur)),
			spread: Number(spread),
			color,
			opacity: Math.min(1, Math.max(0, Number(opacity))),
			inset
		})
	);

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			if (next.offsetX !== Number(offsetX)) offsetX = next.offsetX;
			if (next.offsetY !== Number(offsetY)) offsetY = next.offsetY;
			if (next.blur !== Number(blur)) blur = next.blur;
			if (next.spread !== Number(spread)) spread = next.spread;
			if (next.color !== color) color = next.color;
			if (next.opacity !== Number(opacity)) opacity = next.opacity;
			if (next.inset !== inset) inset = next.inset;
		});
	});

	$effect(() => {
		syncShareParams({ offsetX, offsetY, blur, spread, color, opacity, inset }, shareKeys, {
			defaults: {
				offsetX: String(DEFAULT_OFFSET_X),
				offsetY: String(DEFAULT_OFFSET_Y),
				blur: String(DEFAULT_BLUR),
				spread: String(DEFAULT_SPREAD),
				color: DEFAULT_COLOR,
				opacity: String(DEFAULT_OPACITY),
				inset: String(DEFAULT_INSET)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.css,
			onReset: () => {
				offsetX = DEFAULT_OFFSET_X;
				offsetY = DEFAULT_OFFSET_Y;
				blur = DEFAULT_BLUR;
				spread = DEFAULT_SPREAD;
				color = DEFAULT_COLOR;
				opacity = DEFAULT_OPACITY;
				inset = DEFAULT_INSET;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="bsg-offset-x" label="Offset X (px)">
			<Input id="bsg-offset-x" type="number" bind:value={offsetX} />
		</Field>
		<Field id="bsg-offset-y" label="Offset Y (px)">
			<Input id="bsg-offset-y" type="number" bind:value={offsetY} />
		</Field>
		<Field id="bsg-blur" label="Blur (px)" hint="0 or more">
			<Input id="bsg-blur" type="number" min="0" bind:value={blur} />
		</Field>
		<Field id="bsg-spread" label="Spread (px)">
			<Input id="bsg-spread" type="number" bind:value={spread} />
		</Field>
	</div>

	<Field id="bsg-color" label="Color">
		<div class="flex gap-2">
			<input
				type="color"
				class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
				value={normalizeHex(color)}
				oninput={(e) => {
					color = (e.currentTarget as HTMLInputElement).value;
				}}
				aria-label="Shadow color"
			/>
			<Input id="bsg-color" bind:value={color} class="font-mono" />
		</div>
	</Field>

	<Field id="bsg-opacity" label="Opacity" hint="0–1">
		<Input id="bsg-opacity" type="number" min="0" max="1" step="0.05" bind:value={opacity} />
	</Field>

	<label class="flex items-center gap-2 text-sm text-fg">
		<input type="checkbox" class="size-4 rounded border-border" bind:checked={inset} />
		Inset (draw shadow inside the box)
	</label>

	<div class="flex h-32 items-center justify-center rounded-md border border-border bg-bg">
		<div
			class="h-16 w-28 rounded-md bg-bg-elevated"
			style={`box-shadow:${output.value};`}
			aria-label="Box shadow preview"
		></div>
	</div>

	<Field id="bsg-css" label="CSS">
		<Input id="bsg-css" value={output.css} readonly class="font-mono text-sm" />
	</Field>
</div>
