<script lang="ts">
	import { Alert, Field } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl, validateFile } from '$lib/utils/file';
	import { loadImage } from '$lib/utils/image-canvas';
	import {
		DIVIDER_SIZE_PRESETS,
		layoutDividerSlots,
		motifCycle,
		paintDivider,
		patternNeedsImage,
		type DividerPattern
	} from '$lib/utils/image-divider';
	import { imageDivider } from './index';

	type ListedIcon = { name: string; dataUrl: string };

	const CHECKERBOARD =
		'background-color:#fff;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0';

	const PATTERNS: { value: DividerPattern; title: string; hint: string }[] = [
		{ value: 'repeat', title: 'Repeat', hint: 'Same icon across the row' },
		{ value: 'alternate', title: 'Alternate', hint: 'Cycle your icons (or icon + dot)' },
		{ value: 'sequence', title: 'Sequence', hint: 'Keep upload order, then loop' },
		{ value: 'icon-dot', title: 'Icon + dots', hint: 'Icon, then a matching circle' },
		{ value: 'dots', title: 'Dots', hint: 'Just circles — no upload needed' },
		{ value: 'dashes', title: 'Dashes', hint: 'Just dashes — no upload needed' },
		{ value: 'tilt', title: 'Tilted', hint: 'Same icon, slightly rotated' }
	];

	let error = $state<string | null>(null);
	let icons = $state<ListedIcon[]>([]);
	let pattern = $state<DividerPattern>('repeat');
	let width = $state(1200);
	let height = $state(480);
	let iconSize = $state(56);
	let gap = $state(28);
	let background = $state<'transparent' | 'color'>('transparent');
	let backgroundColor = $state('#000000');
	let accentColor = $state('#f59e0b');
	let outputUrl = $state('');
	let processing = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let previewCanvas = $state<HTMLCanvasElement | null>(null);

	const needsImage = $derived(patternNeedsImage(pattern));
	const canRender = $derived(!needsImage || icons.length > 0);

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
			if (next.length >= 8) {
				error = 'You can add up to 8 icons.';
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

	function resetState() {
		error = null;
		icons = [];
		pattern = 'repeat';
		width = 1200;
		height = 480;
		iconSize = 56;
		gap = 28;
		background = 'transparent';
		backgroundColor = '#000000';
		accentColor = '#f59e0b';
		outputUrl = '';
		processing = false;
	}

	async function paintPreview() {
		const canvas = previewCanvas;
		if (!canvas || !canRender) {
			outputUrl = '';
			return;
		}

		processing = true;
		error = null;
		try {
			const loaded = [];
			for (const icon of icons) {
				const img = await loadImage(icon.dataUrl);
				loaded.push({ width: img.naturalWidth, height: img.naturalHeight, draw: img });
			}

			const cycle = motifCycle(pattern, loaded.length);
			const slots = layoutDividerSlots(width, height, cycle, iconSize, gap);
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
			outputUrl = offscreen.toDataURL('image/png');

			const parent = canvas.parentElement;
			const maxW = Math.max(280, parent?.clientWidth || 720);
			const scale = Math.min(1, maxW / width);
			const displayW = Math.max(1, Math.round(width * scale));
			const displayH = Math.max(1, Math.round(height * scale));
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			canvas.width = Math.round(displayW * dpr);
			canvas.height = Math.round(displayH * dpr);
			canvas.style.width = `${displayW}px`;
			canvas.style.height = `${displayH}px`;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, displayW, displayH);
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(offscreen, 0, 0, displayW, displayH);
		} catch (err) {
			outputUrl = '';
			error = err instanceof Error ? err.message : 'Failed to make divider';
		} finally {
			processing = false;
		}
	}

	$effect(() => {
		void [
			icons,
			pattern,
			width,
			height,
			iconSize,
			gap,
			background,
			backgroundColor,
			accentColor,
			previewCanvas
		];
		void paintPreview();
	});

	$effect(() => {
		setToolShellActions({
			downloadValue: outputUrl,
			downloadFilename: 'divider.png',
			downloadMime: 'image/png',
			copyValue: outputUrl,
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
			Up to 8 images, 2 MB each. PNG with a clear background works best.
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
			<p class="mt-1 text-sm text-muted">1200 × 480 is a common Carrd / blog size.</p>
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
		<Field id="div-icon" label="Icon size ({Math.round(iconSize)}px)">
			<input
				id="div-icon"
				type="range"
				min="16"
				max="160"
				step="2"
				bind:value={iconSize}
				class="w-full accent-fg"
			/>
		</Field>
		<Field id="div-gap" label="Spacing ({Math.round(gap)}px)">
			<input
				id="div-gap"
				type="range"
				min="0"
				max="80"
				step="2"
				bind:value={gap}
				class="w-full accent-fg"
			/>
		</Field>
	</div>

	{#if pattern === 'icon-dot' || pattern === 'dots' || pattern === 'dashes' || (pattern === 'alternate' && icons.length < 2)}
		<Field id="div-accent" label="Dot / dash color">
			<input
				id="div-accent"
				class="h-10 w-full rounded-md border border-border bg-bg px-2"
				type="color"
				bind:value={accentColor}
			/>
		</Field>
	{/if}

	{#if needsImage && !icons.length}
		<p class="text-sm text-muted">
			Add an icon to preview this pattern. Dots and dashes work without one.
		</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if canRender}
		<div class="overflow-x-auto rounded-md border border-border p-3" style={CHECKERBOARD}>
			<canvas bind:this={previewCanvas} class="mx-auto block max-w-full"></canvas>
		</div>
		{#if processing}
			<p class="text-sm text-muted">Updating preview…</p>
		{/if}
	{/if}
</div>
