<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareBool, readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { glassmorphismGenerator, run, normalizeHex } from './index';

	const shareKeys = glassmorphismGenerator.share!.params;
	const DEFAULT_BLUR = 12;
	const DEFAULT_SATURATION = 160;
	const DEFAULT_BG_COLOR = 'ffffff';
	const DEFAULT_BG_OPACITY = 0.2;
	const DEFAULT_BORDER_OPACITY = 0.3;
	const DEFAULT_BORDER_WIDTH = 1;
	const DEFAULT_BORDER_RADIUS = 20;
	const DEFAULT_SHADOW = true;

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		return {
			blur: readShareNumber(sp, 'blur', DEFAULT_BLUR),
			saturation: readShareNumber(sp, 'saturation', DEFAULT_SATURATION),
			bgColor: readShareParam(sp, 'bgColor') ?? DEFAULT_BG_COLOR,
			bgOpacity: readShareNumber(sp, 'bgOpacity', DEFAULT_BG_OPACITY),
			borderOpacity: readShareNumber(sp, 'borderOpacity', DEFAULT_BORDER_OPACITY),
			borderWidth: readShareNumber(sp, 'borderWidth', DEFAULT_BORDER_WIDTH),
			borderRadius: readShareNumber(sp, 'borderRadius', DEFAULT_BORDER_RADIUS),
			shadow: readShareBool(sp, 'shadow', DEFAULT_SHADOW)
		};
	}

	const initial = optionsFromUrl();
	let blur = $state(initial.blur);
	let saturation = $state(initial.saturation);
	let bgColor = $state(initial.bgColor);
	let bgOpacity = $state(initial.bgOpacity);
	let borderOpacity = $state(initial.borderOpacity);
	let borderWidth = $state(initial.borderWidth);
	let borderRadius = $state(initial.borderRadius);
	let shadow = $state(initial.shadow);

	let output = $derived(
		run({
			blur: Math.max(0, Number(blur)),
			saturation: Math.max(0, Number(saturation)),
			bgColor,
			bgOpacity: Math.min(1, Math.max(0, Number(bgOpacity))),
			borderOpacity: Math.min(1, Math.max(0, Number(borderOpacity))),
			borderWidth: Math.max(0, Number(borderWidth)),
			borderRadius: Math.max(0, Number(borderRadius)),
			shadow
		})
	);

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			if (next.blur !== Number(blur)) blur = next.blur;
			if (next.saturation !== Number(saturation)) saturation = next.saturation;
			if (next.bgColor !== bgColor) bgColor = next.bgColor;
			if (next.bgOpacity !== Number(bgOpacity)) bgOpacity = next.bgOpacity;
			if (next.borderOpacity !== Number(borderOpacity)) borderOpacity = next.borderOpacity;
			if (next.borderWidth !== Number(borderWidth)) borderWidth = next.borderWidth;
			if (next.borderRadius !== Number(borderRadius)) borderRadius = next.borderRadius;
			if (next.shadow !== shadow) shadow = next.shadow;
		});
	});

	$effect(() => {
		syncShareParams(
			{ blur, saturation, bgColor, bgOpacity, borderOpacity, borderWidth, borderRadius, shadow },
			shareKeys,
			{
				defaults: {
					blur: String(DEFAULT_BLUR),
					saturation: String(DEFAULT_SATURATION),
					bgColor: DEFAULT_BG_COLOR,
					bgOpacity: String(DEFAULT_BG_OPACITY),
					borderOpacity: String(DEFAULT_BORDER_OPACITY),
					borderWidth: String(DEFAULT_BORDER_WIDTH),
					borderRadius: String(DEFAULT_BORDER_RADIUS),
					shadow: String(DEFAULT_SHADOW)
				}
			}
		);
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.css,
			onReset: () => {
				blur = DEFAULT_BLUR;
				saturation = DEFAULT_SATURATION;
				bgColor = DEFAULT_BG_COLOR;
				bgOpacity = DEFAULT_BG_OPACITY;
				borderOpacity = DEFAULT_BORDER_OPACITY;
				borderWidth = DEFAULT_BORDER_WIDTH;
				borderRadius = DEFAULT_BORDER_RADIUS;
				shadow = DEFAULT_SHADOW;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<div class="flex flex-col gap-4">
		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="gg-blur" label="Blur (px)" hint="0–60">
				<Input id="gg-blur" type="number" min="0" max="60" bind:value={blur} />
			</Field>
			<Field id="gg-saturation" label="Saturation (%)" hint="0–300">
				<Input id="gg-saturation" type="number" min="0" max="300" bind:value={saturation} />
			</Field>
			<Field id="gg-bg-opacity" label="Background opacity" hint="0–1">
				<Input
					id="gg-bg-opacity"
					type="number"
					min="0"
					max="1"
					step="0.05"
					bind:value={bgOpacity}
				/>
			</Field>
			<Field id="gg-border-opacity" label="Border opacity" hint="0–1">
				<Input
					id="gg-border-opacity"
					type="number"
					min="0"
					max="1"
					step="0.05"
					bind:value={borderOpacity}
				/>
			</Field>
			<Field id="gg-border-width" label="Border width (px)">
				<Input id="gg-border-width" type="number" min="0" max="10" bind:value={borderWidth} />
			</Field>
			<Field id="gg-border-radius" label="Border radius (px)">
				<Input id="gg-border-radius" type="number" min="0" max="64" bind:value={borderRadius} />
			</Field>
		</div>

		<Field id="gg-bg-color" label="Background color">
			<div class="flex gap-2">
				<input
					type="color"
					class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
					value={normalizeHex(bgColor)}
					oninput={(e) => {
						bgColor = (e.currentTarget as HTMLInputElement).value;
					}}
					aria-label="Glass tint color"
				/>
				<Input id="gg-bg-color" bind:value={bgColor} class="font-mono" />
			</div>
		</Field>

		<label class="flex items-center gap-2 text-sm text-fg">
			<input type="checkbox" class="size-4 rounded border-border" bind:checked={shadow} />
			Drop shadow
		</label>
	</div>

	<div class="flex flex-col gap-4">
		<div
			class="relative flex h-56 items-center justify-center overflow-hidden rounded-2xl"
			style="background: linear-gradient(135deg, #6366f1, #ec4899 50%, #f59e0b);"
		>
			<div
				class="flex h-36 w-52 items-center justify-center text-center text-sm font-medium text-white"
				style={output.panelStyle}
				aria-label="Glassmorphism preview"
			>
				Glass panel
			</div>
		</div>
		<p class="text-xs text-muted">{output.backgroundHint}</p>

		<Field id="gg-css" label="CSS">
			<Textarea id="gg-css" value={output.css} rows={8} readonly class="font-mono text-sm" />
		</Field>
	</div>
</div>
