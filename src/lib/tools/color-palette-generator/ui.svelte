<script lang="ts">
	import { Alert, Field } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { colorPaletteGenerator, run, type ColorPaletteGeneratorInput } from './index';

	const shareKeys = colorPaletteGenerator.share!.params;
	const DEFAULT_BASE_HEX = '#3b82f6';
	const DEFAULT_MODE: ColorPaletteGeneratorInput['mode'] = 'tints-shades';
	const MODES = new Set<ColorPaletteGeneratorInput['mode']>([
		'tints-shades',
		'complementary',
		'analogous',
		'triadic'
	]);

	const modeLabels: Record<ColorPaletteGeneratorInput['mode'], string> = {
		'tints-shades': 'Tints & shades',
		complementary: 'Complementary',
		analogous: 'Analogous',
		triadic: 'Triadic'
	};

	function fromUrl() {
		const sp = urlSearchParams();
		const raw = readShareParam(sp, 'baseHex');
		const modeRaw = readShareParam(sp, 'mode');
		const mode =
			modeRaw && MODES.has(modeRaw as ColorPaletteGeneratorInput['mode'])
				? (modeRaw as ColorPaletteGeneratorInput['mode'])
				: DEFAULT_MODE;
		const baseHex = raw ? (raw.startsWith('#') ? raw : `#${raw}`) : DEFAULT_BASE_HEX;
		return { baseHex, mode };
	}

	const initial = fromUrl();
	let baseHex = $state(initial.baseHex);
	let mode = $state<ColorPaletteGeneratorInput['mode']>(initial.mode);
	let output = $derived(run({ baseHex, mode }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.baseHex.toLowerCase() !== baseHex.toLowerCase()) baseHex = next.baseHex;
			if (next.mode !== mode) mode = next.mode;
		});
	});

	$effect(() => {
		pushShareState({ baseHex: (output.baseHex || baseHex).replace(/^#/, ''), mode }, shareKeys, {
			defaults: {
				baseHex: DEFAULT_BASE_HEX.replace(/^#/, ''),
				mode: DEFAULT_MODE
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.colors.map((c) => c.hex).join('\n'),
			onReset: () => {
				baseHex = DEFAULT_BASE_HEX;
				mode = DEFAULT_MODE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="cpg-base" label="Base color">
			<div class="flex gap-2">
				<input
					type="color"
					class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
					value={output.baseHex || DEFAULT_BASE_HEX}
					oninput={(e) => {
						baseHex = (e.currentTarget as HTMLInputElement).value;
					}}
					aria-label="Pick base color"
				/>
				<input
					id="cpg-base"
					class="h-10 w-full rounded-md border border-border bg-bg px-3 font-mono text-sm"
					bind:value={baseHex}
				/>
			</div>
		</Field>

		<Field id="cpg-mode" label="Palette mode">
			<select
				id="cpg-mode"
				class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={mode}
			>
				{#each Object.entries(modeLabels) as [value, label] (value)}
					<option {value}>{label}</option>
				{/each}
			</select>
		</Field>
	</div>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each output.colors as color (color.label)}
				<div class="flex flex-col gap-1.5 rounded-md border border-border p-2">
					<div
						class="h-16 w-full rounded-md border border-border"
						style={`background:${color.hex}`}
						aria-hidden="true"
					></div>
					<p class="text-xs font-medium text-muted">{color.label}</p>
					<div class="flex items-center gap-1.5">
						<code class="flex-1 truncate font-mono text-xs">{color.hex}</code>
						<CopyButton value={color.hex} label="Copy" />
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
