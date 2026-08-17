<script lang="ts">
	import { Alert, Button, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import {
		previewGridLayout,
		repeatingUnitPixelSize,
		type SeamlessMode,
		type TilePattern
	} from '$lib/utils/image-tile';
	import {
		buildSourceTile,
		imageTiler,
		paintTiledCanvas,
		WALLPAPER_HEIGHT,
		WALLPAPER_WIDTH
	} from './index';

	const DEFAULT_PATTERN: TilePattern = 'repeat';
	const DEFAULT_SEAMLESS: SeamlessMode = 'off';
	const CHECKERBOARD =
		'background-color:#fff;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let tileDataUrl = $state('');
	let fileName = $state('image');
	let pattern = $state<TilePattern>(DEFAULT_PATTERN);
	let scale = $state(1);
	let gap = $state(0);
	let seamless = $state<SeamlessMode>(DEFAULT_SEAMLESS);
	let feather = $state(24);
	let previewCols = $state('4');
	let showGrid = $state(true);
	let processing = $state(false);
	let wallpaperBusy = $state(false);
	let previewCanvas = $state<HTMLCanvasElement | null>(null);
	let sourceTile = $state<HTMLCanvasElement | null>(null);
	let tileGen = 0;
	let previewEpoch = $state(0);

	function resetState() {
		error = null;
		sourceDataUrl = '';
		tileDataUrl = '';
		fileName = 'image';
		pattern = DEFAULT_PATTERN;
		scale = 1;
		gap = 0;
		seamless = DEFAULT_SEAMLESS;
		feather = 24;
		previewCols = '4';
		showGrid = true;
		sourceTile = null;
		processing = false;
		wallpaperBusy = false;
	}

	function paintLivePreview(canvas: HTMLCanvasElement, tile: HTMLCanvasElement) {
		const parent = canvas.parentElement;
		const maxW = Math.max(240, parent?.clientWidth || 720);
		const maxH = Math.max(240, Math.min(720, Math.round((window.innerHeight || 800) * 0.6)));
		const cols = Math.max(2, Math.round(Number(previewCols)) || 4);
		const layout = previewGridLayout(tile.width, tile.height, Number(gap), cols, maxW, maxH);
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		canvas.width = Math.round(layout.width * dpr);
		canvas.height = Math.round(layout.height * dpr);
		canvas.style.width = `${layout.width}px`;
		canvas.style.height = `${layout.height}px`;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const scaled = document.createElement('canvas');
		scaled.width = layout.tileWidth;
		scaled.height = layout.tileHeight;
		const sctx = scaled.getContext('2d');
		if (!sctx) return;
		sctx.imageSmoothingEnabled = true;
		sctx.imageSmoothingQuality = 'high';
		sctx.drawImage(tile, 0, 0, scaled.width, scaled.height);

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		paintTiledCanvas(ctx, scaled, pattern, layout.gap, layout.width, layout.height, {
			showGrid
		});
	}

	function downloadDataUrl(dataUrl: string, name: string) {
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = name;
		a.click();
	}

	async function downloadWallpaper() {
		const tile = sourceTile;
		if (!tile || wallpaperBusy) return;
		wallpaperBusy = true;
		error = null;
		try {
			const canvas = document.createElement('canvas');
			canvas.width = WALLPAPER_WIDTH;
			canvas.height = WALLPAPER_HEIGHT;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas is not supported in this browser');
			paintTiledCanvas(ctx, tile, pattern, Math.round(Number(gap)), canvas.width, canvas.height);
			downloadDataUrl(canvas.toDataURL('image/png'), `${fileName}-wallpaper.png`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to export wallpaper';
		} finally {
			wallpaperBusy = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
		sourceDataUrl = await readFileAsDataUrl(file);
	}

	$effect(() => {
		const url = sourceDataUrl;
		const nextScale = Number(scale);
		const nextSeamless = seamless;
		const nextFeather = Math.round(Number(feather));
		if (!url) {
			sourceTile = null;
			tileDataUrl = '';
			return;
		}

		const id = ++tileGen;
		processing = true;
		void (async () => {
			try {
				const tile = await buildSourceTile(url, nextScale, nextSeamless, nextFeather);
				if (id !== tileGen) return;
				sourceTile = tile;
				error = null;
			} catch (err) {
				if (id !== tileGen) return;
				sourceTile = null;
				tileDataUrl = '';
				error = err instanceof Error ? err.message : 'Failed to tile image';
			} finally {
				if (id === tileGen) processing = false;
			}
		})();
	});

	$effect(() => {
		const tile = sourceTile;
		void pattern;
		void gap;
		if (!tile) {
			tileDataUrl = '';
			return;
		}
		const size = repeatingUnitPixelSize(tile.width, tile.height, Math.round(Number(gap)), pattern);
		const canvas = document.createElement('canvas');
		canvas.width = size.width;
		canvas.height = size.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		paintTiledCanvas(ctx, tile, pattern, Math.round(Number(gap)), canvas.width, canvas.height);
		tileDataUrl = canvas.toDataURL('image/png');
	});

	$effect(() => {
		const canvas = previewCanvas;
		const tile = sourceTile;
		void previewCols;
		void showGrid;
		void pattern;
		void gap;
		void previewEpoch;
		if (!canvas || !tile) return;
		paintLivePreview(canvas, tile);
	});

	$effect(() => {
		const canvas = previewCanvas;
		if (!canvas || typeof ResizeObserver === 'undefined') return;
		const target = canvas.parentElement ?? canvas;
		const ro = new ResizeObserver(() => {
			previewEpoch += 1;
		});
		ro.observe(target);
		return () => ro.disconnect();
	});

	$effect(() => {
		setToolShellActions({
			copyValue: tileDataUrl,
			downloadValue: tileDataUrl,
			downloadFilename: `${fileName}-tile.png`,
			downloadMime: 'image/png',
			onReset: resetState
		});
	});
</script>

<div class="flex max-w-3xl flex-col gap-4">
	<Dropzone
		constraints={imageTiler.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			tileDataUrl = '';
			sourceTile = null;
		}}
	/>

	<p class="text-sm text-muted">
		Your image stays in this browser. The live preview repeats the tile the same way a background
		would—if it seams, you will see a grid.
	</p>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<div class="grid gap-3 sm:grid-cols-2">
			<Field id="it-pattern" label="Pattern">
				<select
					id="it-pattern"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={pattern}
				>
					<option value="repeat">Repeat</option>
					<option value="mirror">Mirror (flip every other tile)</option>
					<option value="brick">Brick (offset odd rows)</option>
				</select>
			</Field>
			<Field
				id="it-seamless"
				label="Seamless"
				hint={seamless === 'offset'
					? 'Edges move to the center of the tile thumbnail. The tiled preview is the same pattern, shifted.'
					: seamless === 'blend'
						? 'Soft-blends opposite edges. Best for organic textures, not logos.'
						: 'Original pixels. The live preview is the real tiling test.'}
			>
				<select
					id="it-seamless"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={seamless}
				>
					<option value="off">Off (original edges)</option>
					<option value="offset">Offset inspect (50% wrap)</option>
					<option value="blend">Blend edges (non-AI)</option>
				</select>
			</Field>
		</div>

		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<Field id="it-scale" label="Scale ({Math.round(scale * 100)}%)">
				<input
					id="it-scale"
					type="range"
					min="0.25"
					max="2"
					step="0.05"
					bind:value={scale}
					class="w-full accent-fg"
				/>
			</Field>
			<Field id="it-gap" label="Gap ({Math.round(Number(gap))}px)">
				<input
					id="it-gap"
					type="range"
					min="0"
					max="40"
					step="1"
					bind:value={gap}
					class="w-full accent-fg"
				/>
			</Field>
			<Field id="it-feather" label="Blend ({Math.round(Number(feather))}px)">
				<input
					id="it-feather"
					type="range"
					min="4"
					max="64"
					step="1"
					bind:value={feather}
					disabled={seamless !== 'blend'}
					class="w-full accent-fg"
				/>
			</Field>
			<Field id="it-cols" label="Preview density">
				<select
					id="it-cols"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={previewCols}
				>
					<option value="3">3 × 3</option>
					<option value="4">4 × 4</option>
					<option value="6">6 × 6</option>
				</select>
			</Field>
		</div>

		<div>
			<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
				<p class="text-sm font-medium">Live tiling preview</p>
				<label class="flex items-center gap-2 text-sm text-fg">
					<input id="it-grid" type="checkbox" bind:checked={showGrid} class="accent-fg" />
					Show tile edges
				</label>
			</div>
			<div
				class="flex justify-center overflow-hidden rounded-md border border-border"
				style={CHECKERBOARD}
			>
				<canvas bind:this={previewCanvas} class="block max-w-full"></canvas>
			</div>
			{#if processing}
				<p class="mt-2 text-sm text-muted">Updating preview…</p>
			{:else}
				<p class="mt-2 text-sm text-muted">
					If you see a repeating grid of lines, the image does not meet itself. Mirror, Brick, or
					Blend can hide that.
				</p>
			{/if}
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<p class="mb-2 text-sm font-medium">Repeating unit</p>
				{#if tileDataUrl}
					<div class="inline-block rounded-md border border-border p-2" style={CHECKERBOARD}>
						<img
							src={tileDataUrl}
							alt="Tile unit"
							class="h-auto max-h-48 max-w-full object-contain"
						/>
					</div>
					<p class="mt-2 text-sm text-muted">Copy / Download in the action bar saves this PNG.</p>
				{/if}
			</div>
			<div>
				<p class="mb-2 text-sm font-medium">Wallpaper {WALLPAPER_WIDTH}×{WALLPAPER_HEIGHT}</p>
				<p class="mb-2 text-sm text-muted">
					Fills a desktop-sized canvas with the same pattern as the live preview.
				</p>
				<Button
					variant="secondary"
					size="sm"
					disabled={!sourceTile || wallpaperBusy}
					onclick={downloadWallpaper}
				>
					{wallpaperBusy ? 'Exporting…' : 'Download wallpaper'}
				</Button>
			</div>
		</div>
	{:else}
		<p class="text-sm text-muted">
			Upload a texture, pattern, or logo. Repeat / Mirror / Brick plus a live grid so you can see
			seams before you export.
		</p>
	{/if}
</div>
