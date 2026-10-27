<script lang="ts">
	import { Alert, Button, Dropzone, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl, validateFile } from '$lib/utils/file';
	import {
		BLEND_MODES,
		INTENSITY_PRESETS,
		LOOK_FILTER_META,
		LOOK_FILTERS,
		OVERLAY_GROUPS,
		OVERLAY_PRESET_META,
		imageEffects,
		intensityFromPercent,
		run,
		type BlendMode,
		type LookFilter,
		type OverlayPreset
	} from './index';

	const CHECKERBOARD =
		'background-color:#fff;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let processing = $state(false);

	type OverlayCategory = 'none' | 'Rainbow' | 'Moods' | 'Aesthetic' | 'custom';

	let overlayCategory = $state<OverlayCategory>('Rainbow');
	let overlay = $state<OverlayPreset | 'custom'>('rainbow-soft');
	let overlayDataUrl = $state('');
	let overlayName = $state('');
	let intensityPct = $state(35);
	let rainbownessPct = $state(80);
	let blendMode = $state<BlendMode>('overlay');
	let look = $state<LookFilter>('none');
	let hueRotate = $state(0);
	let vignettePct = $state(0);
	let grainPct = $state(0);
	let chromaticPct = $state(0);
	let pixelatePct = $state(0);
	let posterizePct = $state(0);

	let overlayInput = $state<HTMLInputElement | null>(null);

	const categoryOptions: { value: OverlayCategory; label: string }[] = [
		{ value: 'none', label: 'None' },
		{ value: 'Rainbow', label: 'Rainbow' },
		{ value: 'Moods', label: 'Moods' },
		{ value: 'Aesthetic', label: 'Aesthetic' },
		{ value: 'custom', label: 'Custom texture' }
	];

	const intensity = $derived(intensityFromPercent(intensityPct));
	const rainbowness = $derived(intensityFromPercent(rainbownessPct));
	const vignette = $derived(intensityFromPercent(vignettePct));
	const grain = $derived(intensityFromPercent(grainPct));
	const chromatic = $derived(intensityFromPercent(chromaticPct));
	const pixelate = $derived(intensityFromPercent(pixelatePct));
	const posterize = $derived(intensityFromPercent(posterizePct));
	const activeGroup = $derived(OVERLAY_GROUPS.find((g) => g.label === overlayCategory));
	const styleOptions = $derived(activeGroup?.ids ?? []);
	const selectedStyleMeta = $derived(
		overlay !== 'custom' && overlay !== 'none' ? OVERLAY_PRESET_META[overlay] : null
	);
	const showVivid = $derived(
		overlay !== 'custom' &&
			overlay !== 'none' &&
			overlay !== 'scanlines' &&
			overlay !== 'chrome-metal'
	);

	function onCategoryChange(next: OverlayCategory) {
		overlayCategory = next;
		if (next === 'none') {
			overlay = 'none';
			return;
		}
		if (next === 'custom') {
			overlay = 'custom';
			return;
		}
		const group = OVERLAY_GROUPS.find((g) => g.label === next);
		const first = group?.ids[0];
		if (first) overlay = first;
	}

	function onStyleChange(next: string) {
		overlay = next as OverlayPreset;
	}

	async function processImage() {
		if (!sourceDataUrl) {
			outputDataUrl = '';
			return;
		}
		// Waiting on a custom texture — show the source quietly, no error yell.
		if (overlay === 'custom' && !overlayDataUrl) {
			outputDataUrl = sourceDataUrl;
			error = null;
			return;
		}
		processing = true;
		error = null;
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				overlay,
				overlayDataUrl: overlay === 'custom' ? overlayDataUrl : undefined,
				intensity,
				rainbowness,
				blendMode,
				look,
				hueRotate,
				vignette,
				grain,
				chromatic,
				pixelate,
				posterize
			});
			outputDataUrl = out.dataUrl;
		} catch (err) {
			outputDataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to apply effects';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
		sourceDataUrl = await readFileAsDataUrl(file);
		await processImage();
	}

	async function onOverlayFile(list: FileList | null) {
		const file = list?.[0];
		if (!file) return;
		const result = validateFile(file, imageEffects.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		overlayName = file.name;
		overlayDataUrl = await readFileAsDataUrl(file);
		overlayCategory = 'custom';
		overlay = 'custom';
		if (overlayInput) overlayInput.value = '';
		await processImage();
	}

	function resetAll() {
		error = null;
		sourceDataUrl = '';
		outputDataUrl = '';
		fileName = 'image';
		overlayCategory = 'Rainbow';
		overlay = 'rainbow-soft';
		overlayDataUrl = '';
		overlayName = '';
		intensityPct = 35;
		rainbownessPct = 80;
		blendMode = 'overlay';
		look = 'none';
		hueRotate = 0;
		vignettePct = 0;
		grainPct = 0;
		chromaticPct = 0;
		pixelatePct = 0;
		posterizePct = 0;
	}

	$effect(() => {
		void overlay;
		void overlayDataUrl;
		void intensityPct;
		void rainbownessPct;
		void blendMode;
		void look;
		void hueRotate;
		void vignettePct;
		void grainPct;
		void chromaticPct;
		void pixelatePct;
		void posterizePct;
		if (sourceDataUrl) void processImage();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-effects.png`,
			downloadMime: 'image/png',
			onReset: resetAll
		});
	});
</script>

<div class="flex flex-col gap-5">
	<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
		<h2 class="text-base font-semibold text-fg">Source image</h2>
		<p class="mt-1 mb-4 text-sm text-muted">
			Rainbows, moods, vaporwave, light leaks, glitch extras — or drop your own CC0 texture.
		</p>
		<Dropzone
			constraints={imageEffects.file!}
			hint="PNG, JPEG, GIF, or WebP up to 2 MB"
			{onselect}
			onerror={(message) => {
				error = message;
				sourceDataUrl = '';
				outputDataUrl = '';
			}}
		/>
	</section>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<div
			class="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] lg:items-start lg:gap-6"
		>
			<!-- Preview: normal flow on mobile (no sticky overlap); sticky right rail on desktop -->
			<aside class="lg:sticky lg:top-6 lg:order-2 lg:self-start">
				<div
					class="rounded-2xl border border-border bg-bg p-3 shadow-sm ring-1 ring-border/60"
					style={CHECKERBOARD}
				>
					<div class="mb-2 flex items-center justify-between gap-2">
						<p class="text-sm font-medium text-fg">Live preview</p>
						{#if processing}
							<span class="text-xs text-muted">Updating…</span>
						{/if}
					</div>
					{#if outputDataUrl}
						<img
							src={outputDataUrl}
							alt="Effect preview"
							class="mx-auto max-h-[min(40vh,320px)] w-full max-w-full rounded-lg object-contain lg:max-h-[min(70vh,520px)]"
						/>
					{:else}
						<img
							src={sourceDataUrl}
							alt="Source preview"
							class="mx-auto max-h-[min(40vh,320px)] w-full max-w-full rounded-lg object-contain opacity-80 lg:max-h-[min(70vh,520px)]"
						/>
					{/if}
				</div>
				<p class="mt-2 hidden text-sm text-muted lg:block">
					Stays put while you tweak — download from the Action Bar.
				</p>
			</aside>

			<div class="flex flex-col gap-5 lg:order-1">
				<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
					<div class="mb-4">
						<h2 class="text-base font-semibold text-fg">Overlay</h2>
						<p class="mt-1 text-sm text-muted">Choose a mode, then pick the specific style.</p>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<Field id="ie-category" label="Mode">
							<select
								id="ie-category"
								class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
								value={overlayCategory}
								onchange={(e) =>
									onCategoryChange((e.currentTarget as HTMLSelectElement).value as OverlayCategory)}
							>
								{#each categoryOptions as opt (opt.value)}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</Field>

						{#if styleOptions.length}
							<Field id="ie-style" label="Style">
								<select
									id="ie-style"
									class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
									value={overlay}
									onchange={(e) => onStyleChange((e.currentTarget as HTMLSelectElement).value)}
								>
									{#each styleOptions as preset (preset)}
										<option value={preset}>{OVERLAY_PRESET_META[preset].title}</option>
									{/each}
								</select>
								{#if selectedStyleMeta}
									<p class="mt-1 text-sm text-muted">{selectedStyleMeta.hint}</p>
								{/if}
							</Field>
						{:else if overlayCategory === 'none'}
							<p class="self-end text-sm text-muted sm:pb-2">
								No overlay — look filters & extras still apply.
							</p>
						{:else}
							<p class="self-end text-sm text-muted sm:pb-2">Upload your own texture below.</p>
						{/if}
					</div>

					{#if overlay === 'custom'}
						<div class="mt-4 rounded-xl border border-dashed border-border bg-bg px-4 py-4">
							<p class="mb-3 text-sm text-muted">
								{#if overlayName}
									Using <span class="font-medium text-fg">{overlayName}</span> — intensity & blend still
									apply.
								{:else}
									Pick a PNG/JPEG overlay texture whenever you’re ready.
								{/if}
							</p>
							<div class="flex flex-wrap items-center gap-3">
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onclick={() => overlayInput?.click()}
								>
									{overlayName ? 'Change overlay' : 'Upload overlay'}
								</Button>
								<input
									bind:this={overlayInput}
									type="file"
									class="sr-only"
									accept={imageEffects.file!.accept}
									aria-label="Upload custom overlay"
									onchange={(e) => void onOverlayFile((e.currentTarget as HTMLInputElement).files)}
								/>
							</div>
						</div>
					{/if}
				</section>

				<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
					<h2 class="mb-4 text-base font-semibold text-fg">Intensity & blend</h2>

					<Field id="ie-intensity" label="Intensity ({Math.round(intensityPct)}%)">
						<input
							id="ie-intensity"
							type="range"
							min="0"
							max="100"
							step="1"
							bind:value={intensityPct}
							class="w-full accent-fg"
							disabled={overlay === 'none'}
						/>
						<div class="mt-2 flex flex-wrap gap-2">
							{#each INTENSITY_PRESETS as pct (pct)}
								<button
									type="button"
									class="rounded-full border px-3 py-1 text-sm transition-colors {intensityPct ===
									pct
										? 'border-fg bg-fg text-bg'
										: 'border-border text-fg hover:border-fg/40'}"
									onclick={() => (intensityPct = pct)}
									disabled={overlay === 'none'}
								>
									{pct}%
								</button>
							{/each}
						</div>
					</Field>

					{#if showVivid}
						<div class="mt-4">
							<Field
								id="ie-rainbow"
								label="Color vividness ({Math.round(rainbownessPct)}%)"
								hint="How punchy spectrum / mood overlays look."
							>
								<input
									id="ie-rainbow"
									type="range"
									min="0"
									max="100"
									step="1"
									bind:value={rainbownessPct}
									class="w-full accent-fg"
								/>
							</Field>
						</div>
					{/if}

					<div class="mt-4">
						<Field id="ie-blend" label="Blend mode">
							<select
								id="ie-blend"
								class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
								bind:value={blendMode}
								disabled={overlay === 'none'}
							>
								{#each BLEND_MODES as mode (mode)}
									<option value={mode}>{mode}</option>
								{/each}
							</select>
						</Field>
					</div>
				</section>

				<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
					<h2 class="mb-1 text-base font-semibold text-fg">Look filter</h2>
					<p class="mb-4 text-sm text-muted">Color grade on top of the overlay.</p>
					<Field id="ie-look" label="Look">
						<select
							id="ie-look"
							class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
							bind:value={look}
						>
							{#each LOOK_FILTERS as f (f)}
								<option value={f}>{LOOK_FILTER_META[f].title}</option>
							{/each}
						</select>
						<p class="mt-1 text-sm text-muted">{LOOK_FILTER_META[look].hint}</p>
					</Field>
				</section>

				<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
					<h2 class="mb-4 text-base font-semibold text-fg">Extras</h2>
					<div class="grid gap-4 sm:grid-cols-2">
						<Field id="ie-hue" label="Hue rotate ({hueRotate}°)">
							<input
								id="ie-hue"
								type="range"
								min="-180"
								max="180"
								step="1"
								bind:value={hueRotate}
								class="w-full accent-fg"
							/>
						</Field>
						<Field id="ie-chromatic" label="Chromatic fringe ({Math.round(chromaticPct)}%)">
							<input
								id="ie-chromatic"
								type="range"
								min="0"
								max="100"
								step="1"
								bind:value={chromaticPct}
								class="w-full accent-fg"
							/>
						</Field>
						<Field id="ie-pixelate" label="Pixelate ({Math.round(pixelatePct)}%)">
							<input
								id="ie-pixelate"
								type="range"
								min="0"
								max="100"
								step="1"
								bind:value={pixelatePct}
								class="w-full accent-fg"
							/>
						</Field>
						<Field id="ie-posterize" label="Posterize ({Math.round(posterizePct)}%)">
							<input
								id="ie-posterize"
								type="range"
								min="0"
								max="100"
								step="1"
								bind:value={posterizePct}
								class="w-full accent-fg"
							/>
						</Field>
						<Field id="ie-vignette" label="Vignette ({Math.round(vignettePct)}%)">
							<input
								id="ie-vignette"
								type="range"
								min="0"
								max="100"
								step="1"
								bind:value={vignettePct}
								class="w-full accent-fg"
							/>
						</Field>
						<Field id="ie-grain" label="Grain ({Math.round(grainPct)}%)">
							<input
								id="ie-grain"
								type="range"
								min="0"
								max="100"
								step="1"
								bind:value={grainPct}
								class="w-full accent-fg"
							/>
						</Field>
					</div>
				</section>
			</div>
		</div>
	{/if}
</div>
