<script lang="ts">
	import { Alert, Button, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { downloadText } from '$engine/share-state';
	import { readFileAsDataUrl, validateFile } from '$lib/utils/file';
	import { loadImage } from '$lib/utils/image-canvas';
	import {
		DIVIDER_SIZE_PRESETS,
		MAX_DIVIDER_MOTIFS,
		MAX_DIVIDER_UPLOADS,
		effectsAreAnimated,
		encodeDividerGif,
		isStarbanner,
		layoutDividerSlots,
		layoutScrollTile,
		layoutStarbannerSlots,
		maxMotifCount,
		motifCycle,
		normalizeEffects,
		paintDivider,
		patternNeedsImage,
		type DividerEffects,
		type DividerPattern
	} from '$lib/utils/image-divider';
	import { imageDivider } from './index';

	type ListedIcon = { name: string; dataUrl: string };

	const CHECKERBOARD =
		'background-color:#fff;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0';

	const PATTERNS: { value: DividerPattern; title: string; hint: string }[] = [
		{ value: 'repeat', title: 'Repeat', hint: 'Cycle all uploads across the row' },
		{ value: 'alternate', title: 'Alternate', hint: 'Cycle your icons (or icon + dot)' },
		{ value: 'sequence', title: 'Sequence', hint: 'Keep upload order, then loop' },
		{ value: 'icon-dot', title: 'Icon + dots', hint: 'Each icon, then a matching circle' },
		{ value: 'dots', title: 'Dots', hint: 'Just circles — no upload needed' },
		{ value: 'dashes', title: 'Dashes', hint: 'Just dashes — no upload needed' },
		{ value: 'tilt', title: 'Tilted', hint: 'All icons, alternating lean' },
		{
			value: 'starbanner',
			title: 'Starbanner',
			hint: 'Line — ornament — line (upload optional)'
		}
	];

	const EFFECT_SWITCHES: {
		key: keyof DividerEffects;
		title: string;
		hint: string;
	}[] = [
		{ key: 'rainbow', title: 'Rainbow', hint: 'Hue / color cycle' },
		{ key: 'scroll', title: 'Scroll', hint: 'Marquee slide along the strip' },
		{ key: 'bounce', title: 'Bounce', hint: 'Snake bob up and down' }
	];

	let error = $state<string | null>(null);
	let icons = $state<ListedIcon[]>([]);
	let pattern = $state<DividerPattern>('repeat');
	let fxRainbow = $state(false);
	let fxScroll = $state(false);
	let fxBounce = $state(false);
	let speed = $state(1);
	let width = $state(1200);
	let height = $state(120);
	let iconSize = $state(48);
	let gap = $state(24);
	let motifCount = $state(0);
	let background = $state<'transparent' | 'color'>('transparent');
	let backgroundColor = $state('#000000');
	let accentColor = $state('#f59e0b');
	let outputUrl = $state('');
	let gifBusy = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let previewCanvas = $state<HTMLCanvasElement | null>(null);

	const effects = $derived(
		normalizeEffects({ rainbow: fxRainbow, scroll: fxScroll, bounce: fxBounce })
	);
	const needsImage = $derived(patternNeedsImage(pattern));
	const canRender = $derived(!needsImage || icons.length > 0);
	const animated = $derived(effectsAreAnimated(effects));
	const iconSizeMax = $derived(Math.max(16, Math.min(160, height)));
	const effectiveIconSize = $derived(Math.min(iconSize, iconSizeMax));
	const starbanner = $derived(isStarbanner(pattern));
	const motifMax = $derived.by(() => {
		if (isStarbanner(pattern)) return 1;
		const cycle = motifCycle(pattern, icons.length);
		if (!cycle.length) return 1;
		return Math.min(
			MAX_DIVIDER_MOTIFS,
			Math.max(1, maxMotifCount(width, cycle, effectiveIconSize, gap))
		);
	});
	const effectiveCount = $derived(motifCount > 0 ? Math.min(motifCount, motifMax) : motifMax);

	function effectOn(key: keyof DividerEffects): boolean {
		if (key === 'rainbow') return fxRainbow;
		if (key === 'scroll') return fxScroll;
		return fxBounce;
	}

	function setEffect(key: keyof DividerEffects, on: boolean) {
		if (key === 'rainbow') fxRainbow = on;
		else if (key === 'scroll') fxScroll = on;
		else fxBounce = on;
	}

	function sizePresetId(w: number, h: number) {
		return DIVIDER_SIZE_PRESETS.find((p) => p.width === w && p.height === h)?.id ?? 'custom';
	}

	function applyPreset(id: string) {
		const preset = DIVIDER_SIZE_PRESETS.find((p) => p.id === id);
		if (!preset) return;
		width = preset.width;
		height = preset.height;
	}

	async function addFiles(list: FileList | null) {
		if (!list?.length) return;
		error = null;
		const next = [...icons];
		for (const file of Array.from(list)) {
			if (next.length >= MAX_DIVIDER_UPLOADS) {
				error = `You can add up to ${MAX_DIVIDER_UPLOADS} icons (max).`;
				break;
			}
			const result = validateFile(file, imageDivider.file!);
			if (!result.ok) {
				error = result.error;
				continue;
			}
			next.push({
				name: file.name.replace(/\.[^.]+$/, ''),
				dataUrl: await readFileAsDataUrl(file)
			});
		}
		icons = next;
		if (inputEl) inputEl.value = '';
	}

	function removeAt(index: number) {
		icons = icons.filter((_, i) => i !== index);
	}

	function move(index: number, dir: -1 | 1) {
		const target = index + dir;
		if (target < 0 || target >= icons.length) return;
		const next = [...icons];
		[next[index], next[target]] = [next[target]!, next[index]!];
		icons = next;
	}

	function revokeOutput() {
		if (outputUrl.startsWith('blob:')) URL.revokeObjectURL(outputUrl);
		outputUrl = '';
	}

	function resetState() {
		error = null;
		icons = [];
		pattern = 'repeat';
		fxRainbow = false;
		fxScroll = false;
		fxBounce = false;
		speed = 1;
		width = 1200;
		height = 120;
		iconSize = 48;
		gap = 24;
		motifCount = 0;
		background = 'transparent';
		backgroundColor = '#000000';
		accentColor = '#f59e0b';
		revokeOutput();
		gifBusy = false;
	}

	async function loadIcons() {
		const loaded = [];
		for (const icon of icons) {
			const img = await loadImage(icon.dataUrl);
			loaded.push({ width: img.naturalWidth, height: img.naturalHeight, draw: img });
		}
		return loaded;
	}

	function layoutForCurrent(loaded: Awaited<ReturnType<typeof loadIcons>>) {
		if (isStarbanner(pattern)) {
			const slots = layoutStarbannerSlots(
				width,
				height,
				effectiveIconSize,
				gap,
				loaded.length >= 1
			);
			return {
				slots,
				unitWidth: width,
				cycleLength: slots.length
			};
		}

		const cycle = motifCycle(pattern, loaded.length);

		if (effects.scroll) {
			const tile = layoutScrollTile(cycle, height, effectiveIconSize, gap);
			return {
				slots: tile.slots,
				unitWidth: tile.period,
				cycleLength: tile.cycleLength
			};
		}

		const slots = layoutDividerSlots(width, height, cycle, effectiveIconSize, gap, effectiveCount);
		return {
			slots,
			unitWidth: width,
			cycleLength: Math.max(1, cycle.length)
		};
	}

	$effect(() => {
		if (iconSize > iconSizeMax) iconSize = iconSizeMax;
		if (motifCount > motifMax) motifCount = motifMax;
	});

	function sizePreviewCanvas(canvas: HTMLCanvasElement) {
		const parent = canvas.parentElement;
		const maxW = Math.max(280, parent?.clientWidth || 720);
		const scale = Math.min(1, maxW / width);
		const displayW = Math.max(1, Math.round(width * scale));
		const displayH = Math.max(1, Math.round(height * scale));
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const targetW = Math.round(displayW * dpr);
		const targetH = Math.round(displayH * dpr);
		// Only resize when needed — setting canvas.width every frame clears & stutters.
		if (canvas.width !== targetW || canvas.height !== targetH) {
			canvas.width = targetW;
			canvas.height = targetH;
		}
		canvas.style.width = `${displayW}px`;
		canvas.style.height = `${displayH}px`;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		return { ctx, displayW, displayH };
	}

	async function downloadGif() {
		if (!canRender || !animated || gifBusy) return;
		gifBusy = true;
		error = null;
		try {
			const loaded = await loadIcons();
			const { slots, unitWidth, cycleLength } = layoutForCurrent(loaded);
			const blob = await encodeDividerGif({
				width,
				height,
				slots,
				icons: loaded,
				background,
				backgroundColor,
				accentColor,
				effects,
				unitWidth,
				cycleLength,
				frameCount: Math.round(18 / Math.max(0.5, Math.min(1.5, speed))),
				delayMs: Math.round(90 / Math.max(0.5, Math.min(2, speed)))
			});
			const href = URL.createObjectURL(blob);
			downloadText('divider.gif', href, 'image/gif');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to export GIF';
		} finally {
			gifBusy = false;
		}
	}

	async function paintStillPng() {
		const canvas = previewCanvas;
		if (!canvas || !canRender) {
			revokeOutput();
			return;
		}
		error = null;
		try {
			const loaded = await loadIcons();
			const { slots } = layoutForCurrent(loaded);
			const offscreen = document.createElement('canvas');
			offscreen.width = width;
			offscreen.height = height;
			const octx = offscreen.getContext('2d');
			if (!octx) throw new Error('Canvas is not supported in this browser');
			paintDivider(octx, {
				width,
				height,
				slots,
				icons: loaded,
				background,
				backgroundColor,
				accentColor
			});
			revokeOutput();
			outputUrl = offscreen.toDataURL('image/png');

			const sized = sizePreviewCanvas(canvas);
			if (!sized) return;
			sized.ctx.clearRect(0, 0, sized.displayW, sized.displayH);
			sized.ctx.imageSmoothingEnabled = true;
			sized.ctx.imageSmoothingQuality = 'high';
			sized.ctx.drawImage(offscreen, 0, 0, sized.displayW, sized.displayH);
		} catch (err) {
			revokeOutput();
			error = err instanceof Error ? err.message : 'Failed to make divider';
		}
	}

	$effect(() => {
		void [
			icons,
			pattern,
			fxRainbow,
			fxScroll,
			fxBounce,
			speed,
			width,
			height,
			iconSize,
			gap,
			motifCount,
			motifMax,
			background,
			backgroundColor,
			accentColor,
			previewCanvas
		];

		if (!canRender || !previewCanvas) {
			revokeOutput();
			return;
		}

		if (!animated) {
			void paintStillPng();
			return;
		}

		let cancelled = false;
		let raf = 0;
		const started = performance.now();
		const loopMs = 1600 / Math.max(0.35, Math.min(2.5, speed));

		void (async () => {
			try {
				const loaded = await loadIcons();
				if (cancelled) return;
				const { slots, unitWidth, cycleLength } = layoutForCurrent(loaded);
				const offscreen = document.createElement('canvas');
				offscreen.width = width;
				offscreen.height = height;
				const octx = offscreen.getContext('2d');
				if (!octx) throw new Error('Canvas is not supported in this browser');

				// Loop length locks to an integer number of pixels scrolled for a clean wrap.
				const period = Math.max(1, unitWidth);
				const tick = (now: number) => {
					if (cancelled) return;
					const canvas = previewCanvas;
					if (!canvas) return;
					const sized = sizePreviewCanvas(canvas);
					if (!sized) return;

					const elapsed = (now - started) % loopMs;
					const progress = elapsed / loopMs;
					paintDivider(octx, {
						width,
						height,
						slots,
						icons: loaded,
						background,
						backgroundColor,
						accentColor,
						anim: { effects, progress, unitWidth: period, cycleLength }
					});
					sized.ctx.clearRect(0, 0, sized.displayW, sized.displayH);
					sized.ctx.imageSmoothingEnabled = true;
					sized.ctx.imageSmoothingQuality = 'high';
					sized.ctx.drawImage(offscreen, 0, 0, sized.displayW, sized.displayH);
					raf = requestAnimationFrame(tick);
				};
				raf = requestAnimationFrame(tick);
			} catch (err) {
				if (!cancelled) {
					error = err instanceof Error ? err.message : 'Failed to preview animation';
				}
			}
		})();

		return () => {
			cancelled = true;
			cancelAnimationFrame(raf);
		};
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: animated ? '' : outputUrl,
			downloadFilename: 'divider.png',
			downloadMime: 'image/png',
			copyValue: animated ? '' : outputUrl,
			onReset: resetState
		});
	});
</script>

<div class="flex max-w-3xl flex-col gap-4">
	<div
		role="button"
		tabindex="0"
		class="cursor-pointer rounded-lg border border-dashed border-border bg-bg-elevated px-4 py-8 text-center"
		onclick={() => inputEl?.click()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				inputEl?.click();
			}
		}}
	>
		<p class="font-medium text-fg">Add icons</p>
		<p class="mt-1 text-sm text-muted">
			Up to {MAX_DIVIDER_UPLOADS} images (max), 2 MB each. PNG with a clear background works best.
		</p>
	</div>

	<input
		bind:this={inputEl}
		type="file"
		class="sr-only"
		multiple
		accept={imageDivider.file!.accept}
		aria-label="Upload divider icons"
		onchange={(e) => addFiles((e.currentTarget as HTMLInputElement).files)}
	/>

	{#if icons.length}
		<ul class="flex flex-wrap gap-2">
			{#each icons as icon, i (icon.dataUrl + i)}
				<li class="flex items-center gap-2 rounded-md border border-border px-2 py-1">
					<img src={icon.dataUrl} alt="" class="h-8 w-8 object-contain" />
					<span class="max-w-28 truncate text-sm">{icon.name}</span>
					<button type="button" class="text-xs text-muted hover:text-fg" onclick={() => move(i, -1)}
						>Up</button
					>
					<button type="button" class="text-xs text-muted hover:text-fg" onclick={() => move(i, 1)}
						>Down</button
					>
					<button type="button" class="text-xs text-muted hover:text-fg" onclick={() => removeAt(i)}
						>Remove</button
					>
				</li>
			{/each}
		</ul>
	{/if}

	<Field id="div-pattern" label="Pattern">
		<div class="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="div-pattern">
			{#each PATTERNS as item (item.value)}
				<label
					class="flex cursor-pointer gap-3 rounded-md border px-3 py-2 transition-colors {pattern ===
					item.value
						? 'border-fg bg-bg-elevated'
						: 'border-border hover:border-fg/40'}"
				>
					<input
						type="radio"
						name="div-pattern"
						value={item.value}
						bind:group={pattern}
						class="mt-1 accent-fg"
					/>
					<span class="min-w-0">
						<span class="block font-medium text-fg">{item.title}</span>
						<span class="mt-0.5 block text-sm text-muted">{item.hint}</span>
					</span>
				</label>
			{/each}
		</div>
	</Field>

	<Field id="div-effects" label="Effects">
		<div class="grid gap-2" role="group" aria-labelledby="div-effects">
			{#each EFFECT_SWITCHES as item (item.key)}
				<div
					class="flex items-center justify-between gap-3 rounded-md border px-3 py-2 transition-colors {effectOn(
						item.key
					)
						? 'border-fg bg-bg-elevated'
						: 'border-border'}"
				>
					<span class="min-w-0">
						<span class="block font-medium text-fg">{item.title}</span>
						<span class="mt-0.5 block text-sm text-muted">{item.hint}</span>
					</span>
					<button
						type="button"
						role="switch"
						aria-checked={effectOn(item.key)}
						aria-label={item.title}
						class="relative h-6 w-11 shrink-0 rounded-full transition-colors {effectOn(item.key)
							? 'bg-fg'
							: 'bg-border'}"
						onclick={() => setEffect(item.key, !effectOn(item.key))}
					>
						<span
							class="absolute top-0.5 left-0.5 size-5 rounded-full bg-bg transition-transform {effectOn(
								item.key
							)
								? 'translate-x-5'
								: 'translate-x-0'}"
						></span>
					</button>
				</div>
			{/each}
		</div>
		<p class="mt-2 text-sm text-muted">
			Mix any combo. All off = still PNG. Any on = animated GIF.
		</p>
	</Field>

	{#if animated}
		<Field id="div-speed" label="Speed ({speed.toFixed(1)}×)">
			<input
				id="div-speed"
				type="range"
				min="0.4"
				max="2.2"
				step="0.1"
				bind:value={speed}
				class="w-full accent-fg"
			/>
		</Field>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="div-size" label="Size">
			<select
				id="div-size"
				class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
				value={sizePresetId(width, height)}
				onchange={(e) => applyPreset((e.currentTarget as HTMLSelectElement).value)}
			>
				{#each DIVIDER_SIZE_PRESETS as preset (preset.id)}
					<option value={preset.id}>{preset.label}</option>
				{/each}
			</select>
			<p class="mt-1 text-sm text-muted">Thin / strip sizes work great for animated GIFs.</p>
		</Field>

		<Field id="div-bg" label="Background">
			<select
				id="div-bg"
				class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={background}
			>
				<option value="transparent">Transparent</option>
				<option value="color">Solid color</option>
			</select>
			{#if background === 'color'}
				<input
					class="mt-2 h-10 w-full rounded-md border border-border bg-bg px-2"
					type="color"
					bind:value={backgroundColor}
					aria-label="Background color"
				/>
			{/if}
		</Field>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="div-icon" label="Icon size ({Math.round(effectiveIconSize)}px)">
			<input
				id="div-icon"
				type="range"
				min="16"
				max={iconSizeMax}
				step="2"
				bind:value={iconSize}
				class="w-full accent-fg"
			/>
			<p class="mt-1 text-sm text-muted">Capped to strip height ({height}px).</p>
		</Field>
		<Field
			id="div-gap"
			label={starbanner
				? `Ornament gap (${Math.round(gap)}px)`
				: `Min spacing (${Math.round(gap)}px)`}
		>
			<input
				id="div-gap"
				type="range"
				min="0"
				max="80"
				step="2"
				bind:value={gap}
				class="w-full accent-fg"
			/>
			<p class="mt-1 text-sm text-muted">
				{starbanner
					? 'Space between each line and the center ornament.'
					: 'Used to calculate the max count; row still fills edge-to-edge.'}
			</p>
		</Field>
	</div>

	{#if !starbanner}
		<Field id="div-count" label="Images in row ({effectiveCount} / max {motifMax})">
			<input
				id="div-count"
				type="range"
				min="1"
				max={motifMax}
				step="1"
				value={effectiveCount}
				oninput={(e) => {
					motifCount = Number((e.currentTarget as HTMLInputElement).value);
				}}
				class="w-full accent-fg"
			/>
			<p class="mt-1 text-sm text-muted">
				How many icons (or dots/dashes) across the strip. Max depends on size, icon size, and
				spacing.
			</p>
		</Field>
	{/if}

	{#if pattern === 'icon-dot' || pattern === 'dots' || pattern === 'dashes' || pattern === 'starbanner' || (pattern === 'alternate' && icons.length < 2)}
		<Field id="div-accent" label={starbanner ? 'Line / star color' : 'Dot / dash color'}>
			<input
				id="div-accent"
				class="h-10 w-full rounded-md border border-border bg-bg px-2"
				type="color"
				bind:value={accentColor}
			/>
			{#if fxRainbow}
				<p class="mt-1 text-sm text-muted">Rainbow overrides this while animating.</p>
			{/if}
		</Field>
	{/if}

	{#if needsImage && !icons.length}
		<p class="text-sm text-muted">
			Add an icon to preview this pattern. Dots, dashes, and Starbanner work without one.
		</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if canRender}
		<div class="overflow-x-auto rounded-md border border-border p-2" style={CHECKERBOARD}>
			<canvas bind:this={previewCanvas} class="mx-auto block max-w-full"></canvas>
		</div>
		{#if background === 'transparent'}
			<p class="text-sm text-muted">
				Checkerboard is the preview only — transparent areas stay clear in the export.
			</p>
		{/if}

		{#if animated}
			<div class="flex flex-wrap items-center gap-3">
				<Button type="button" onclick={() => void downloadGif()} disabled={gifBusy}>
					{gifBusy ? 'Encoding GIF…' : 'Download GIF'}
				</Button>
				<p class="text-sm text-muted">Live preview above — export when it looks right.</p>
			</div>
		{:else}
			<p class="text-sm text-muted">Download the PNG from the Action Bar.</p>
		{/if}
	{/if}
</div>
