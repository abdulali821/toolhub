<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { gradientGenerator, run, type GradientGeneratorInput } from './index';

	const shareKeys = gradientGenerator.share!.params;
	const DEFAULT_TYPE: GradientGeneratorInput['type'] = 'linear';
	const DEFAULT_ANGLE = 90;
	const DEFAULT_COLOR1 = '#2563eb';
	const DEFAULT_COLOR2 = '#9333ea';

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		const typeRaw = readShareParam(sp, 'type');
		const type: GradientGeneratorInput['type'] = typeRaw === 'radial' ? 'radial' : DEFAULT_TYPE;
		return {
			type,
			angle: readShareNumber(sp, 'angle', DEFAULT_ANGLE),
			color1: readShareParam(sp, 'color1') ?? DEFAULT_COLOR1,
			color2: readShareParam(sp, 'color2') ?? DEFAULT_COLOR2
		};
	}

	const initial = optionsFromUrl();
	let type = $state<GradientGeneratorInput['type']>(initial.type);
	let angle = $state(initial.angle);
	let color1 = $state(initial.color1);
	let color2 = $state(initial.color2);
	let output = $derived(run({ type, angle: Number(angle), color1, color2 }));

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			if (next.type !== type) type = next.type;
			if (next.angle !== Number(angle)) angle = next.angle;
			if (next.color1 !== color1) color1 = next.color1;
			if (next.color2 !== color2) color2 = next.color2;
		});
	});

	$effect(() => {
		syncShareParams({ type, angle, color1, color2 }, shareKeys, {
			defaults: {
				type: DEFAULT_TYPE,
				angle: String(DEFAULT_ANGLE),
				color1: DEFAULT_COLOR1,
				color2: DEFAULT_COLOR2
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.css,
			onReset: () => {
				type = DEFAULT_TYPE;
				angle = DEFAULT_ANGLE;
				color1 = DEFAULT_COLOR1;
				color2 = DEFAULT_COLOR2;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="gg-type" label="Gradient type">
		<select
			id="gg-type"
			class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
			bind:value={type}
		>
			<option value="linear">Linear</option>
			<option value="radial">Radial</option>
		</select>
	</Field>

	{#if type === 'linear'}
		<Field id="gg-angle" label="Angle (deg)" hint="0–360">
			<Input id="gg-angle" type="number" min="0" max="360" bind:value={angle} />
		</Field>
	{/if}

	<Field id="gg-color1" label="Color 1">
		<div class="flex gap-2">
			<input
				type="color"
				class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
				value={color1.startsWith('#') ? color1 : `#${color1}`}
				oninput={(e) => {
					color1 = (e.currentTarget as HTMLInputElement).value;
				}}
				aria-label="Color 1"
			/>
			<Input id="gg-color1" bind:value={color1} class="font-mono" />
		</div>
	</Field>

	<Field id="gg-color2" label="Color 2">
		<div class="flex gap-2">
			<input
				type="color"
				class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
				value={color2.startsWith('#') ? color2 : `#${color2}`}
				oninput={(e) => {
					color2 = (e.currentTarget as HTMLInputElement).value;
				}}
				aria-label="Color 2"
			/>
			<Input id="gg-color2" bind:value={color2} class="font-mono" />
		</div>
	</Field>

	<div
		class="h-32 rounded-md border border-border"
		style={`background:${output.css}`}
		aria-label="Gradient preview"
	></div>

	<Field id="gg-css" label="CSS gradient">
		<Input id="gg-css" value={output.css} readonly class="font-mono text-sm" />
	</Field>
</div>
