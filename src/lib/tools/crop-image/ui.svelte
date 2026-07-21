<script lang="ts">
	import { Alert, Button, Field, Input } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { cropImage, run } from './index';

	type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let naturalWidth = $state(0);
	let naturalHeight = $state(0);
	/** Crop in natural image pixels */
	let cropX = $state(0);
	let cropY = $state(0);
	let cropWidth = $state(1);
	let cropHeight = $state(1);
	let processing = $state(false);
	let stageEl = $state<HTMLDivElement | null>(null);
	let displayWidth = $state(0);
	let displayHeight = $state(0);

	let drag: {
		handle: Handle;
		startClientX: number;
		startClientY: number;
		originX: number;
		originY: number;
		originW: number;
		originH: number;
	} | null = $state(null);

	const scale = $derived(naturalWidth > 0 && displayWidth > 0 ? displayWidth / naturalWidth : 1);

	const boxStyle = $derived.by(() => {
		const left = cropX * scale;
		const top = cropY * scale;
		const width = Math.max(1, cropWidth * scale);
		const height = Math.max(1, cropHeight * scale);
		return `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
	});

	function clampCrop(x: number, y: number, w: number, h: number) {
		const minSize = 8;
		let nextW = Math.max(minSize, Math.min(w, naturalWidth));
		let nextH = Math.max(minSize, Math.min(h, naturalHeight));
		let nextX = Math.max(0, Math.min(x, naturalWidth - nextW));
		let nextY = Math.max(0, Math.min(y, naturalHeight - nextH));
		if (nextX + nextW > naturalWidth) nextW = naturalWidth - nextX;
		if (nextY + nextH > naturalHeight) nextH = naturalHeight - nextY;
		cropX = Math.round(nextX);
		cropY = Math.round(nextY);
		cropWidth = Math.max(1, Math.round(nextW));
		cropHeight = Math.max(1, Math.round(nextH));
	}

	function measureStage() {
		if (!stageEl) return;
		const rect = stageEl.getBoundingClientRect();
		if (rect.width <= 0 || naturalWidth <= 0) return;
		const ratio = naturalHeight / naturalWidth;
		displayWidth = rect.width;
		displayHeight = rect.width * ratio;
	}

	async function processImage() {
		if (!sourceDataUrl || !naturalWidth) return;
		processing = true;
		error = null;
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				x: cropX,
				y: cropY,
				width: cropWidth,
				height: cropHeight
			});
			outputDataUrl = out.dataUrl;
		} catch (err) {
			outputDataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to crop image';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.[^.]+$/, '');
		sourceDataUrl = await readFileAsDataUrl(file);
		outputDataUrl = '';

		const img = new Image();
		img.onload = () => {
			naturalWidth = img.naturalWidth;
			naturalHeight = img.naturalHeight;
			// Default to centered ~80% crop — feels like a real cropper
			const w = Math.round(img.naturalWidth * 0.8);
			const h = Math.round(img.naturalHeight * 0.8);
			clampCrop(
				Math.round((img.naturalWidth - w) / 2),
				Math.round((img.naturalHeight - h) / 2),
				w,
				h
			);
			requestAnimationFrame(() => {
				measureStage();
				void processImage();
			});
		};
		img.src = sourceDataUrl;
	}

	function startDrag(handle: Handle, event: PointerEvent) {
		event.preventDefault();
		event.stopPropagation();
		(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
		drag = {
			handle,
			startClientX: event.clientX,
			startClientY: event.clientY,
			originX: cropX,
			originY: cropY,
			originW: cropWidth,
			originH: cropHeight
		};
	}

	function onPointerMove(event: PointerEvent) {
		if (!drag || scale <= 0) return;
		const dx = (event.clientX - drag.startClientX) / scale;
		const dy = (event.clientY - drag.startClientY) / scale;
		const { handle, originX, originY, originW, originH } = drag;

		if (handle === 'move') {
			clampCrop(originX + dx, originY + dy, originW, originH);
			return;
		}

		let x = originX;
		let y = originY;
		let w = originW;
		let h = originH;

		if (handle.includes('e')) w = originW + dx;
		if (handle.includes('s')) h = originH + dy;
		if (handle.includes('w')) {
			x = originX + dx;
			w = originW - dx;
		}
		if (handle.includes('n')) {
			y = originY + dy;
			h = originH - dy;
		}

		if (w < 8) {
			if (handle.includes('w')) x = originX + originW - 8;
			w = 8;
		}
		if (h < 8) {
			if (handle.includes('n')) y = originY + originH - 8;
			h = 8;
		}

		clampCrop(x, y, w, h);
	}

	function endDrag() {
		if (!drag) return;
		drag = null;
		void processImage();
	}

	function resetSelection() {
		if (!naturalWidth) return;
		clampCrop(0, 0, naturalWidth, naturalHeight);
		void processImage();
	}

	function applyManualNumbers() {
		clampCrop(Number(cropX), Number(cropY), Number(cropWidth), Number(cropHeight));
		void processImage();
	}

	$effect(() => {
		if (!sourceDataUrl || !naturalWidth) return;
		measureStage();
		const onResize = () => measureStage();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-cropped.png`,
			downloadMime: 'image/png',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				outputDataUrl = '';
				fileName = 'image';
				naturalWidth = 0;
				naturalHeight = 0;
				cropX = 0;
				cropY = 0;
				cropWidth = 1;
				cropHeight = 1;
				displayWidth = 0;
				displayHeight = 0;
				drag = null;
			}
		});
	});
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={endDrag} onpointercancel={endDrag} />

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={cropImage.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			sourceDataUrl = '';
			outputDataUrl = '';
		}}
	/>

	{#if !sourceDataUrl}
		<p class="text-sm text-muted">Upload an image, then drag the crop box to select a region.</p>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl && naturalWidth}
		<div class="flex flex-wrap items-center justify-between gap-2">
			<p class="text-sm text-muted">
				{naturalWidth} × {naturalHeight} px · Selection {cropWidth} × {cropHeight}
			</p>
			<Button type="button" variant="ghost" size="sm" onclick={resetSelection}>
				Reset selection
			</Button>
		</div>

		<!-- Interactive crop stage -->
		<div
			bind:this={stageEl}
			class="relative w-full touch-none overflow-hidden rounded-md border border-border bg-bg-elevated select-none"
			style={displayHeight ? `height:${displayHeight}px` : undefined}
			role="application"
			aria-label="Crop selection. Drag the box or handles to adjust."
		>
			<img
				src={sourceDataUrl}
				alt=""
				draggable="false"
				class="pointer-events-none absolute inset-0 h-full w-full object-contain object-top-left"
				style={displayWidth ? `width:${displayWidth}px;height:${displayHeight}px;` : undefined}
			/>

			<!-- Crop box + dimmed exterior via large box-shadow -->
			<div
				class="absolute cursor-move border-2 border-white"
				style={`${boxStyle}box-shadow:0 0 0 9999px rgb(0 0 0 / 0.55);`}
				onpointerdown={(e) => startDrag('move', e)}
				role="slider"
				aria-valuemin={0}
				aria-valuemax={naturalWidth}
				aria-valuenow={cropX}
				aria-label="Crop region. Drag to move."
				tabindex="0"
			>
				<!-- Rule-of-thirds guides -->
				<div class="pointer-events-none absolute inset-0" aria-hidden="true">
					<div class="absolute top-0 left-1/3 h-full w-px bg-white/35"></div>
					<div class="absolute top-0 left-2/3 h-full w-px bg-white/35"></div>
					<div class="absolute top-1/3 left-0 h-px w-full bg-white/35"></div>
					<div class="absolute top-2/3 left-0 h-px w-full bg-white/35"></div>
				</div>

				<!-- Corner handles -->
				<button
					type="button"
					class="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-white bg-fg"
					aria-label="Resize from top-left"
					onpointerdown={(e) => startDrag('nw', e)}
				></button>
				<button
					type="button"
					class="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 cursor-nesw-resize rounded-sm border border-white bg-fg"
					aria-label="Resize from top-right"
					onpointerdown={(e) => startDrag('ne', e)}
				></button>
				<button
					type="button"
					class="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 cursor-nesw-resize rounded-sm border border-white bg-fg"
					aria-label="Resize from bottom-left"
					onpointerdown={(e) => startDrag('sw', e)}
				></button>
				<button
					type="button"
					class="absolute -right-1.5 -bottom-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border border-white bg-fg"
					aria-label="Resize from bottom-right"
					onpointerdown={(e) => startDrag('se', e)}
				></button>

				<!-- Edge handles -->
				<button
					type="button"
					class="absolute -top-1.5 left-1/2 h-3 w-3.5 -translate-x-1/2 cursor-ns-resize rounded-sm border border-white bg-fg"
					aria-label="Resize from top"
					onpointerdown={(e) => startDrag('n', e)}
				></button>
				<button
					type="button"
					class="absolute -bottom-1.5 left-1/2 h-3 w-3.5 -translate-x-1/2 cursor-ns-resize rounded-sm border border-white bg-fg"
					aria-label="Resize from bottom"
					onpointerdown={(e) => startDrag('s', e)}
				></button>
				<button
					type="button"
					class="absolute top-1/2 -left-1.5 h-3.5 w-3 -translate-y-1/2 cursor-ew-resize rounded-sm border border-white bg-fg"
					aria-label="Resize from left"
					onpointerdown={(e) => startDrag('w', e)}
				></button>
				<button
					type="button"
					class="absolute top-1/2 -right-1.5 h-3.5 w-3 -translate-y-1/2 cursor-ew-resize rounded-sm border border-white bg-fg"
					aria-label="Resize from right"
					onpointerdown={(e) => startDrag('e', e)}
				></button>
			</div>
		</div>

		<details class="rounded-md border border-border px-3 py-2">
			<summary class="cursor-pointer text-sm font-medium">Fine-tune pixels</summary>
			<div class="mt-3 grid gap-3 sm:grid-cols-2">
				<Field id="ci-x" label="X (px)">
					<Input id="ci-x" type="number" min="0" bind:value={cropX} onchange={applyManualNumbers} />
				</Field>
				<Field id="ci-y" label="Y (px)">
					<Input id="ci-y" type="number" min="0" bind:value={cropY} onchange={applyManualNumbers} />
				</Field>
				<Field id="ci-width" label="Width (px)">
					<Input
						id="ci-width"
						type="number"
						min="1"
						bind:value={cropWidth}
						onchange={applyManualNumbers}
					/>
				</Field>
				<Field id="ci-height" label="Height (px)">
					<Input
						id="ci-height"
						type="number"
						min="1"
						bind:value={cropHeight}
						onchange={applyManualNumbers}
					/>
				</Field>
			</div>
		</details>

		{#if processing}
			<p class="text-sm text-muted">Updating crop…</p>
		{:else if outputDataUrl}
			<div>
				<p class="mb-2 text-sm font-medium">Preview</p>
				<img
					src={outputDataUrl}
					alt="Cropped preview"
					class="max-h-56 w-auto rounded-md border border-border"
				/>
			</div>
		{/if}
	{/if}
</div>
