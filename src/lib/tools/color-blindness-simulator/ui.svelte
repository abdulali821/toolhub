<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { applyBlindnessToImageData } from '$lib/utils/color';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { colorBlindnessSimulator, run, type ColorBlindnessSimulatorInput } from './index';

	const shareKeys = colorBlindnessSimulator.share!.params;
	const DEFAULT_COLORS = '#ef4444, #22c55e, #3b82f6';
	const DEFAULT_MODE: ColorBlindnessSimulatorInput['mode'] = 'colors';
	const DEFAULT_TYPE: ColorBlindnessSimulatorInput['type'] = 'deuteranopia';

	const CVD_TYPES: ColorBlindnessSimulatorInput['type'][] = [
		'protanopia',
		'deuteranopia',
		'tritanopia',
		'achromatopsia'
	];

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode: ColorBlindnessSimulatorInput['mode'] =
			modeRaw === 'image' || modeRaw === 'colors' ? modeRaw : DEFAULT_MODE;
		const typeRaw = readShareParam(sp, 'type') as ColorBlindnessSimulatorInput['type'] | null;
		const type = typeRaw && CVD_TYPES.includes(typeRaw) ? typeRaw : DEFAULT_TYPE;
		return {
			mode,
			type,
			colors: readShareParam(sp, 'colors') ?? DEFAULT_COLORS
		};
	}

	const initial = fromUrl();
	let mode = $state<ColorBlindnessSimulatorInput['mode']>(initial.mode);
	let type = $state<ColorBlindnessSimulatorInput['type']>(initial.type);
	let colors = $state(initial.colors);
	let imageError = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let simulatedDataUrl = $state('');
	let processing = $state(false);

	let output = $derived(run({ mode, type, colors }));
	let hexList = $derived(output.colors.map((c) => c.simulated).join('\n'));

	async function simulateImage(dataUrl: string) {
		processing = true;
		imageError = null;
		simulatedDataUrl = '';
		try {
			const img = new Image();
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('Failed to load image'));
				img.src = dataUrl;
			});

			const canvas = document.createElement('canvas');
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas not available');

			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const simulated = applyBlindnessToImageData(imageData.data, type);
			imageData.data.set(simulated);
			ctx.putImageData(imageData, 0, 0);
			simulatedDataUrl = canvas.toDataURL('image/png');
		} catch (err) {
			imageError = err instanceof Error ? err.message : 'Failed to simulate image';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		imageError = null;
		sourceDataUrl = await readFileAsDataUrl(file);
		await simulateImage(sourceDataUrl);
	}

	$effect(() => {
		if (mode !== 'image' || !sourceDataUrl) return;
		void type;
		void simulateImage(sourceDataUrl);
	});

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.mode !== mode) mode = next.mode;
			if (next.type !== type) type = next.type;
			if (next.colors !== colors) colors = next.colors;
		});
	});

	$effect(() => {
		pushShareState({ mode, type, colors }, shareKeys, {
			defaults: { mode: DEFAULT_MODE, type: DEFAULT_TYPE, colors: DEFAULT_COLORS }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: mode === 'colors' ? hexList : '',
			onReset: () => {
				mode = DEFAULT_MODE;
				type = DEFAULT_TYPE;
				colors = DEFAULT_COLORS;
				imageError = null;
				sourceDataUrl = '';
				simulatedDataUrl = '';
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="cvd-mode" label="Mode">
		<select
			id="cvd-mode"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={mode}
		>
			<option value="colors">Colors (palette)</option>
			<option value="image">Image</option>
		</select>
	</Field>

	<Field id="cvd-type" label="Simulation type">
		<select
			id="cvd-type"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={type}
		>
			<option value="protanopia">Protanopia</option>
			<option value="deuteranopia">Deuteranopia</option>
			<option value="tritanopia">Tritanopia</option>
			<option value="achromatopsia">Achromatopsia</option>
		</select>
	</Field>

	{#if mode === 'colors'}
		<Field id="cvd-colors" label="Colors" hint="Comma or newline separated hex values">
			<Textarea id="cvd-colors" bind:value={colors} rows={4} class="font-mono text-sm" />
		</Field>

		{#if output.error}
			<Alert variant="danger" title="Error">{output.error}</Alert>
		{:else if output.colors.length}
			<div class="flex flex-col gap-3">
				{#each output.colors as color (color.original)}
					<div class="flex items-center gap-3 rounded-md border border-border p-3">
						<div class="flex flex-1 flex-col gap-1">
							<span class="text-xs text-muted">Original {color.original}</span>
							<div
								class="h-10 rounded-md border border-border"
								style={`background:${color.original}`}
							></div>
						</div>
						<div class="flex flex-1 flex-col gap-1">
							<span class="text-xs text-muted">Simulated {color.simulated}</span>
							<div
								class="h-10 rounded-md border border-border"
								style={`background:${color.simulated}`}
							></div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<Dropzone
			constraints={colorBlindnessSimulator.file!}
			hint="PNG, JPEG, GIF, or WebP up to 2 MB"
			{onselect}
			onerror={(message) => {
				imageError = message;
				sourceDataUrl = '';
				simulatedDataUrl = '';
			}}
		/>

		{#if imageError}
			<Alert variant="danger" title="Error">{imageError}</Alert>
		{/if}

		{#if processing}
			<p class="text-sm text-muted">Simulating image…</p>
		{:else if sourceDataUrl && simulatedDataUrl}
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-2">
					<p class="text-sm font-medium">Original</p>
					<img
						src={sourceDataUrl}
						alt="Original upload"
						class="max-h-64 w-full rounded-md border border-border object-contain"
					/>
				</div>
				<div class="flex flex-col gap-2">
					<p class="text-sm font-medium">Simulated ({type})</p>
					<img
						src={simulatedDataUrl}
						alt="Simulated preview"
						class="max-h-64 w-full rounded-md border border-border object-contain"
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>
