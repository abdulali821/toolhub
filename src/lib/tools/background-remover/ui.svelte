<script lang="ts">
	import type { Action } from 'svelte/action';
	import { tick, untrack } from 'svelte';
	import { Alert, Button, Field, Input } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { toast } from 'svelte-sonner';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { restoreStrokeFromRgba } from '$lib/utils/background-brush';
	import {
		parseHexTarget,
		removeGlobalColorFromRgba,
		removeSmallOpaqueIslands
	} from '$lib/utils/background-cleanup';
	import { loadImage, sampleImageColor } from '$lib/utils/image-canvas';
	import {
		beginBackgroundRemovalGeneration,
		cancelBackgroundRemovalJobs,
		isBackgroundRemovalModelReady,
		isBrowserAiRemovalSupported,
		removeBackgroundWithAi,
		type AiRemovalProgress
	} from '$lib/background-removal';
	import { backgroundRemover, run } from './index';

	const DEFAULT_TOLERANCE = 32;
	const DEFAULT_FEATHER = 8;
	const DEFAULT_COLOR = '#ffffff';
	const DEFAULT_ERASER_SIZE = 28;
	const DEFAULT_SPECKLE_SIZE = 128;
	const HISTORY_MAX = 30;
	const CHECKERBOARD =
		'background-color:#fff;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0';
	const PREVIEW_MAX_CLASS = 'block max-h-[min(70vh,28rem)] max-w-full';

	type EngineMode = 'ai' | 'color' | 'wand';
	type ResultTool = 'remove' | 'erase';
	type PreviewBg = 'checker' | 'black' | 'purple' | 'green';

	const PREVIEW_BACKGROUNDS: { id: PreviewBg; label: string; style: string; swatch: string }[] = [
		{ id: 'checker', label: 'Checker', style: CHECKERBOARD, swatch: CHECKERBOARD },
		{
			id: 'black',
			label: 'Black',
			style: 'background-color:#000',
			swatch: 'background-color:#000'
		},
		{
			id: 'purple',
			label: 'Light purple',
			style: 'background-color:#d4b5ff',
			swatch: 'background-color:#d4b5ff'
		},
		{
			id: 'green',
			label: 'Bright green',
			style: 'background-color:#00e676',
			swatch: 'background-color:#00e676'
		}
	];

	const portal: Action<HTMLElement> = (node) => {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	};

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let fileName = $state('image');
	let mode = $state<EngineMode>('ai');
	let color = $state(DEFAULT_COLOR);
	let tolerance = $state(DEFAULT_TOLERANCE);
	let feather = $state(DEFAULT_FEATHER);
	let seedX = $state<number | null>(null);
	let seedY = $state<number | null>(null);
	let resultTool = $state<ResultTool>('remove');
	let eraserSize = $state(DEFAULT_ERASER_SIZE);
	let speckleMaxSize = $state(DEFAULT_SPECKLE_SIZE);
	let processing = $state(false);
	let progressMessage = $state('Preparing AI…');
	let progressRatio = $state<number | null>(null);
	let aiSupported = $state(true);
	let hint = $state('Pick a mode, then upload. AI is best for photos and products.');
	let lastFailedAi = $state(false);
	let previewBg = $state<PreviewBg>('checker');
	let enlargeOpen = $state(false);
	let history = $state<ImageData[]>([]);
	let historyIndex = $state(-1);

	let resultCanvas = $state<HTMLCanvasElement | null>(null);
	let resultWrap = $state<HTMLDivElement | null>(null);
	let sourceImageData = $state<ImageData | null>(null);
	let resultImageData = $state<ImageData | null>(null);
	let erasing = $state(false);
	let cursorVisible = $state(false);
	let cursorX = $state(0);
	let cursorY = $state(0);
	let cursorDiameter = $state(DEFAULT_ERASER_SIZE);
	let paintGen = 0;
	let lastErase: { x: number; y: number } | null = null;
	let suppressResultClick = false;
	let applyingHistory = false;

	const classicMode = $derived(mode === 'color' || mode === 'wand');
	const hasResult = $derived(Boolean(outputDataUrl && resultImageData));
	const canErase = $derived(Boolean(hasResult && sourceImageData));
	const canUndo = $derived(historyIndex > 0);
	const canRedo = $derived(historyIndex >= 0 && historyIndex < history.length - 1);
	const previewBgStyle = $derived(
		PREVIEW_BACKGROUNDS.find((b) => b.id === previewBg)?.style ?? CHECKERBOARD
	);
	const resultDisplayUrl = $derived.by(() => {
		if (outputDataUrl) return outputDataUrl;
		if (mode === 'wand' && sourceDataUrl) return sourceDataUrl;
		return '';
	});
	const showResultStage = $derived(Boolean(resultImageData) || Boolean(resultDisplayUrl));

	function cloneImageData(src: ImageData): ImageData {
		return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
	}

	function clearHistory() {
		history = [];
		historyIndex = -1;
	}

	function resetHistoryWithCurrent() {
		if (!resultImageData) {
			clearHistory();
			return;
		}
		history = [cloneImageData(resultImageData)];
		historyIndex = 0;
	}

	/** Keep a baseline snapshot before mutating so Undo has somewhere to go. */
	function captureHistoryBaseline() {
		if (!resultImageData) return;
		if (history.length === 0 || historyIndex < 0) {
			history = [cloneImageData(resultImageData)];
			historyIndex = 0;
		}
	}

	/** Push the current canvas state as a new undo step (call after an edit). */
	function commitHistoryStep() {
		if (!resultImageData) return;
		if (history.length === 0 || historyIndex < 0) {
			resetHistoryWithCurrent();
			return;
		}
		const snap = cloneImageData(resultImageData);
		let next = history.slice(0, historyIndex + 1);
		next.push(snap);
		if (next.length > HISTORY_MAX) next = next.slice(next.length - HISTORY_MAX);
		history = next;
		historyIndex = history.length - 1;
	}

	function paintFromResultImageData() {
		const canvas = resultCanvas;
		const data = resultImageData;
		if (!canvas || !data) return;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;
		if (canvas.width !== data.width || canvas.height !== data.height) {
			canvas.width = data.width;
			canvas.height = data.height;
		}
		ctx.putImageData(data, 0, 0);
	}

	function applyHistoryFrame(index: number) {
		const frame = history[index];
		if (!frame || processing || erasing) return;
		applyingHistory = true;
		resultImageData = cloneImageData(frame);
		historyIndex = index;
		paintFromResultImageData();
		const canvas = resultCanvas;
		if (canvas) {
			revokeIfBlobUrl(outputDataUrl);
			outputDataUrl = canvas.toDataURL('image/png');
		}
		applyingHistory = false;
		hint = 'Undid or redid a step. Keep editing, or download when ready.';
	}

	function undo() {
		if (historyIndex <= 0 || processing || erasing) return;
		applyHistoryFrame(historyIndex - 1);
	}

	function redo() {
		if (historyIndex < 0 || historyIndex >= history.length - 1 || processing || erasing) return;
		applyHistoryFrame(historyIndex + 1);
	}

	function closeEnlarge() {
		enlargeOpen = false;
	}

	function onGlobalKeydown(event: KeyboardEvent) {
		if (enlargeOpen && event.key === 'Escape') {
			event.preventDefault();
			closeEnlarge();
			return;
		}
		const target = event.target as HTMLElement | null;
		if (
			target &&
			(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
		) {
			return;
		}
		const mod = event.ctrlKey || event.metaKey;
		if (!mod || !outputDataUrl) return;
		const key = event.key.toLowerCase();
		if (key === 'z' && !event.shiftKey) {
			event.preventDefault();
			undo();
		} else if (key === 'y' || (key === 'z' && event.shiftKey)) {
			event.preventDefault();
			redo();
		}
	}

	function hintForMode(next: EngineMode, hasImage: boolean): string {
		if (next === 'ai') {
			return hasImage
				? 'Subject is detected automatically. Switch to Eraser to paint areas back in.'
				: 'Pick a mode, then upload. AI is best for photos and products.';
		}
		if (next === 'color') {
			return hasImage
				? 'Click to remove background. Switch to Eraser to restore original pixels.'
				: 'Pick Color key, then upload. Matching pixels are removed everywhere.';
		}
		return hasImage
			? 'Click to remove background. Use Clean speckles or Sweep key color for leftover dots.'
			: 'Pick Magic wand, then upload. Click a connected background region to remove it.';
	}

	function applyMode(value: EngineMode) {
		mode = value;
		error = null;
		lastFailedAi = false;
		resultTool = 'remove';
		enlargeOpen = false;
		hint = hintForMode(value, Boolean(sourceDataUrl));
		if (!sourceDataUrl) return;
		cancelBackgroundRemovalJobs();
		clearOutput();
		clearHistory();
		seedX = null;
		seedY = null;
		if (value === 'ai') void processAi();
		else if (value === 'color') void processClassic(sourceDataUrl);
	}

	function revokeIfBlobUrl(url: string) {
		if (url.startsWith('blob:')) URL.revokeObjectURL(url);
	}

	function clearOutput() {
		revokeIfBlobUrl(outputDataUrl);
		outputDataUrl = '';
		resultImageData = null;
	}

	function onAiProgress(p: AiRemovalProgress) {
		progressMessage = p.message;
		progressRatio = p.ratio ?? null;
	}

	async function cacheSourcePixels() {
		if (!sourceDataUrl) {
			sourceImageData = null;
			return;
		}
		const img = await loadImage(sourceDataUrl);
		const canvas = document.createElement('canvas');
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;
		ctx.drawImage(img, 0, 0);
		sourceImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	async function loadResultPixels(url: string): Promise<ImageData | null> {
		const img = await loadImage(url);
		const canvas = document.createElement('canvas');
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return null;
		ctx.drawImage(img, 0, 0);
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	/** Decode result offscreen, then paint onto the visible canvas when it exists. */
	async function applyResultUrl(url: string): Promise<boolean> {
		const gen = ++paintGen;
		const data = await loadResultPixels(url);
		if (gen !== paintGen || !data) return false;
		resultImageData = data;
		await tick();
		paintFromResultImageData();
		// Canvas may mount one frame later (first result) — try again.
		if (!resultCanvas) {
			await tick();
			paintFromResultImageData();
		}
		return Boolean(resultImageData);
	}

	function syncOutputFromCanvas() {
		const canvas = resultCanvas;
		if (!canvas || !resultImageData) return;
		revokeIfBlobUrl(outputDataUrl);
		outputDataUrl = canvas.toDataURL('image/png');
	}

	function applyCleanup(mutator: (work: ImageData) => string) {
		const canvas = resultCanvas;
		const work = resultImageData;
		if (!canvas || !work || processing) return;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;
		captureHistoryBaseline();
		hint = mutator(work);
		ctx.putImageData(work, 0, 0);
		syncOutputFromCanvas();
		commitHistoryStep();
	}

	function cleanSpeckles() {
		applyCleanup((work) => {
			const { removedIslands } = removeSmallOpaqueIslands(
				work.data,
				work.width,
				work.height,
				Math.round(Number(speckleMaxSize))
			);
			if (removedIslands === 0) {
				return 'No speckles at this size — try a larger max or Sweep key color.';
			}
			return `Removed ${removedIslands} stray speckle${removedIslands === 1 ? '' : 's'}. Run again or increase max size if dots remain.`;
		});
	}

	function sweepKeyColor() {
		applyCleanup((work) => {
			const { affected } = removeGlobalColorFromRgba(
				work.data,
				parseHexTarget(color),
				Math.round(Number(tolerance)),
				Math.round(Number(feather))
			);
			if (affected === 0) {
				return 'No pixels matched the key color — sample the background color first.';
			}
			return `Removed ${affected} matching pixels globally. Use Eraser if part of the subject was affected.`;
		});
	}

	function coordsFromCanvas(event: PointerEvent | MouseEvent, canvas: HTMLCanvasElement) {
		const rect = canvas.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;
		return {
			x: ((event.clientX - rect.left) / rect.width) * canvas.width,
			y: ((event.clientY - rect.top) / rect.height) * canvas.height
		};
	}

	function updateEraserCursor(event: PointerEvent) {
		const wrap = resultWrap;
		const canvas = resultCanvas;
		if (!wrap || !canvas || resultTool !== 'erase') return;
		const wrapRect = wrap.getBoundingClientRect();
		cursorX = event.clientX - wrapRect.left;
		cursorY = event.clientY - wrapRect.top;
		const rect = canvas.getBoundingClientRect();
		cursorDiameter = Math.max(4, (eraserSize / canvas.width) * rect.width * 2);
	}

	function stampErase(x: number, y: number) {
		const canvas = resultCanvas;
		const source = sourceImageData;
		const work = resultImageData;
		if (!canvas || !source || !work) return;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;
		const radius = Math.max(1, Number(eraserSize));
		if (lastErase) {
			restoreStrokeFromRgba(
				work.data,
				source.data,
				work.width,
				work.height,
				lastErase.x,
				lastErase.y,
				x,
				y,
				radius
			);
		} else {
			restoreStrokeFromRgba(work.data, source.data, work.width, work.height, x, y, x, y, radius);
		}
		ctx.putImageData(work, 0, 0);
		lastErase = { x, y };
	}

	function onResultPointerDown(event: PointerEvent) {
		if (resultTool !== 'erase' || !canErase || processing) return;
		const canvas = resultCanvas;
		if (!canvas) return;
		const coords = coordsFromCanvas(event, canvas);
		if (!coords) return;
		captureHistoryBaseline();
		erasing = true;
		lastErase = null;
		cursorVisible = true;
		updateEraserCursor(event);
		canvas.setPointerCapture(event.pointerId);
		stampErase(coords.x, coords.y);
	}

	function onResultPointerMove(event: PointerEvent) {
		updateEraserCursor(event);
		if (!erasing || resultTool !== 'erase') return;
		const canvas = resultCanvas;
		if (!canvas) return;
		const coords = coordsFromCanvas(event, canvas);
		if (!coords) return;
		stampErase(coords.x, coords.y);
	}

	function onResultPointerUp(event: PointerEvent) {
		if (!erasing) return;
		erasing = false;
		lastErase = null;
		suppressResultClick = true;
		const canvas = resultCanvas;
		if (canvas?.hasPointerCapture(event.pointerId)) {
			canvas.releasePointerCapture(event.pointerId);
		}
		syncOutputFromCanvas();
		commitHistoryStep();
		hint = 'Eraser restores pixels from the original. Switch to Remove to cut more background.';
	}

	function onResultPointerLeave() {
		cursorVisible = false;
	}

	async function processClassic(baseDataUrl: string, fromResult = false) {
		if (!baseDataUrl) return;
		if (untrack(() => processing)) return;
		if (mode === 'wand' && (seedX == null || seedY == null)) {
			hint = hintForMode('wand', true);
			return;
		}
		if (fromResult) captureHistoryBaseline();
		processing = true;
		error = null;
		lastFailedAi = false;
		try {
			const out = await run({
				dataUrl: baseDataUrl,
				mode,
				color,
				tolerance: Math.round(Number(tolerance)),
				feather: Math.round(Number(feather)),
				seedX: seedX ?? undefined,
				seedY: seedY ?? undefined
			});
			// Keep previous output visible until the new pixels are ready (avoids blank green flash).
			const painted = await applyResultUrl(out.dataUrl);
			if (!painted) {
				throw new Error('Could not render the result preview');
			}
			revokeIfBlobUrl(outputDataUrl);
			outputDataUrl = out.dataUrl;
			resultTool = 'remove';
			await tick();
			paintFromResultImageData();
			if (fromResult) commitHistoryStep();
			else resetHistoryWithCurrent();
			hint =
				mode === 'wand'
					? 'Click leftover patches to remove more, or switch to Eraser to restore areas.'
					: 'Switch to Eraser to paint the original back in, or keep removing.';
		} catch (err) {
			if (!fromResult && mode === 'wand' && !outputDataUrl) {
				/* keep source preview visible */
			} else if (fromResult && outputDataUrl) {
				/* keep last good output */
			} else {
				clearOutput();
				clearHistory();
			}
			const message = err instanceof Error ? err.message : 'Failed to remove background';
			// Soft interaction tips → toast (bottom-right). Hard failures stay inline with Retry.
			toast.error(message);
			error = null;
			lastFailedAi = false;
		} finally {
			processing = false;
		}
	}

	async function processAi() {
		if (!sourceDataUrl) return;
		if (untrack(() => processing)) return;
		if (!aiSupported) {
			toast.error(
				'On-device AI isn’t available in this browser. Switch to Color key or Magic wand, or try Chrome, Edge, Firefox, or Safari.'
			);
			return;
		}

		const generation = beginBackgroundRemovalGeneration();
		processing = true;
		error = null;
		lastFailedAi = false;
		progressMessage = isBackgroundRemovalModelReady() ? 'Removing background…' : 'Preparing AI…';
		progressRatio = null;
		hint = isBackgroundRemovalModelReady()
			? 'Model is cached in this browser. Your image stays on-device.'
			: 'First run may download a model to your device. Your image stays in this browser.';

		try {
			const dataUrl = await removeBackgroundWithAi(sourceDataUrl, {
				generation,
				onProgress: onAiProgress
			});
			const painted = await applyResultUrl(dataUrl);
			if (!painted) {
				throw new Error('Could not render the result preview');
			}
			revokeIfBlobUrl(outputDataUrl);
			outputDataUrl = dataUrl;
			resultTool = 'remove';
			clearHistory();
			await tick();
			paintFromResultImageData();
			resetHistoryWithCurrent();
			progressMessage = 'Background removed';
			hint = 'Switch to Eraser to restore areas, then download the PNG.';
		} catch (err) {
			const message = err instanceof Error ? err.message : 'AI background removal failed';
			if (message === 'Cancelled') {
				return;
			}
			clearOutput();
			clearHistory();
			error = message;
			lastFailedAi = true;
		} finally {
			processing = false;
		}
	}

	async function processForCurrentMode() {
		if (mode === 'ai') await processAi();
		else if (mode === 'color') await processClassic(sourceDataUrl);
	}

	async function sampleAt(dataUrl: string, x: number, y: number) {
		try {
			const sample = await sampleImageColor(dataUrl, x, y);
			color = sample.hex;
		} catch {
			/* keep previous color */
		}
	}

	function imageFromClick(event: MouseEvent): HTMLImageElement | null {
		const target = event.currentTarget as HTMLElement;
		const img = target instanceof HTMLImageElement ? target : target.querySelector('img');
		if (!img || !img.naturalWidth) return null;
		return img;
	}

	function coordsFromClick(event: MouseEvent, img: HTMLImageElement) {
		const rect = img.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;
		const x = ((event.clientX - rect.left) / rect.width) * img.naturalWidth;
		const y = ((event.clientY - rect.top) / rect.height) * img.naturalHeight;
		return { x: Math.floor(x), y: Math.floor(y) };
	}

	async function onImageClick(event: MouseEvent) {
		if (mode === 'ai' || untrack(() => processing)) return;
		const img = imageFromClick(event);
		if (!img) return;
		const coords = coordsFromClick(event, img);
		if (!coords) return;
		seedX = coords.x;
		seedY = coords.y;
		await sampleAt(sourceDataUrl, seedX, seedY);
		await processClassic(sourceDataUrl, false);
	}

	async function onResultCanvasClick(event: MouseEvent) {
		if (suppressResultClick) {
			suppressResultClick = false;
			return;
		}
		if (mode === 'ai' || resultTool === 'erase' || !resultDisplayUrl || untrack(() => processing)) {
			return;
		}
		const canvas = resultCanvas;
		if (!canvas) return;
		const coords = coordsFromCanvas(event, canvas);
		if (!coords) return;
		seedX = Math.floor(coords.x);
		seedY = Math.floor(coords.y);
		const base = outputDataUrl || sourceDataUrl;
		await sampleAt(base, seedX, seedY);
		await processClassic(base, true);
	}

	function resetAll() {
		cancelBackgroundRemovalJobs();
		error = null;
		lastFailedAi = false;
		revokeIfBlobUrl(sourceDataUrl);
		clearOutput();
		clearHistory();
		sourceDataUrl = '';
		sourceImageData = null;
		fileName = 'image';
		mode = 'ai';
		color = DEFAULT_COLOR;
		tolerance = DEFAULT_TOLERANCE;
		feather = DEFAULT_FEATHER;
		seedX = null;
		seedY = null;
		resultTool = 'remove';
		eraserSize = DEFAULT_ERASER_SIZE;
		speckleMaxSize = DEFAULT_SPECKLE_SIZE;
		previewBg = 'checker';
		enlargeOpen = false;
		progressMessage = 'Preparing AI…';
		progressRatio = null;
		hint = hintForMode('ai', false);
	}

	async function onselect(file: File) {
		cancelBackgroundRemovalJobs();
		error = null;
		lastFailedAi = false;
		fileName = file.name.replace(/\.[^.]+$/, '') || 'image';
		clearOutput();
		clearHistory();
		enlargeOpen = false;
		seedX = null;
		seedY = null;
		resultTool = 'remove';
		sourceDataUrl = await readFileAsDataUrl(file);
		await cacheSourcePixels();
		hint = hintForMode(mode, true);
		try {
			const sample = await sampleImageColor(sourceDataUrl, 0, 0);
			color = sample.hex;
		} catch {
			color = DEFAULT_COLOR;
		}
		await processForCurrentMode();
	}

	$effect(() => {
		aiSupported = isBrowserAiRemovalSupported();
		return () => {
			cancelBackgroundRemovalJobs();
		};
	});

	$effect(() => {
		void sourceDataUrl;
		void cacheSourcePixels();
	});

	/** Re-paint when the canvas remounts (e.g. opening/closing larger view). */
	$effect(() => {
		void enlargeOpen;
		const canvas = resultCanvas;
		if (!canvas || applyingHistory || erasing) return;

		if (resultImageData) {
			paintFromResultImageData();
			return;
		}

		// Magic wand: show the source on the result canvas until the first removal.
		if (mode === 'wand' && sourceDataUrl && !outputDataUrl) {
			const url = sourceDataUrl;
			void loadResultPixels(url).then((data) => {
				if (!data || resultCanvas !== canvas) return;
				if (untrack(() => Boolean(outputDataUrl || resultImageData))) return;
				resultImageData = data;
				paintFromResultImageData();
			});
		}
	});

	$effect(() => {
		if (mode !== 'color' || !sourceDataUrl) return;
		void color;
		void tolerance;
		void feather;
		if (untrack(() => processing)) return;
		// Defer so onselect can finish sampling color before the first auto-run.
		const id = window.setTimeout(() => {
			if (untrack(() => processing || mode !== 'color' || !sourceDataUrl)) return;
			void processClassic(sourceDataUrl);
		}, 0);
		return () => window.clearTimeout(id);
	});

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputDataUrl,
			downloadFilename: `${fileName}-no-background.png`,
			downloadMime: 'image/png',
			onReset: resetAll
		});
	});
</script>

<svelte:window onkeydown={onGlobalKeydown} />

<div class="flex max-w-4xl flex-col gap-4">
	<Field id="br-mode" label="Mode">
		<select
			id="br-mode"
			class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
			value={mode}
			disabled={processing}
			onchange={(e) => applyMode((e.currentTarget as HTMLSelectElement).value as EngineMode)}
		>
			<option value="ai" disabled={!aiSupported}>AI (on-device)</option>
			<option value="color">Color key (all matching pixels)</option>
			<option value="wand">Magic wand (connected region)</option>
		</select>
	</Field>

	<p class="text-sm text-muted">{hint}</p>

	<Dropzone
		constraints={backgroundRemover.file!}
		hint="PNG, JPEG, GIF, or WebP up to 5 MB"
		disabled={processing}
		{onselect}
		onerror={(message) => {
			toast.error(message);
			error = null;
			cancelBackgroundRemovalJobs();
			clearOutput();
			clearHistory();
			sourceDataUrl = '';
			sourceImageData = null;
			hint = hintForMode(mode, false);
		}}
	/>

	<p class="text-sm text-muted">
		Your image is processed directly in your browser. It isn't uploaded to our servers.
	</p>

	{#if !aiSupported}
		<Alert variant="warning" title="AI unavailable">
			This browser can’t run on-device AI. Use Color key or Magic wand instead.
		</Alert>
	{/if}

	{#if error}
		<Alert variant="danger" title="Error">
			{error}
			{#if lastFailedAi}
				<div class="mt-3">
					<Button type="button" size="sm" variant="secondary" onclick={() => void processAi()}
						>Retry AI</Button
					>
				</div>
			{/if}
		</Alert>
	{/if}

	{#if sourceDataUrl}
		{#if hasResult}
			<div class="grid gap-3 sm:grid-cols-2">
				<Field id="br-result-tool" label="Result tool">
					<select
						id="br-result-tool"
						class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
						bind:value={resultTool}
						disabled={processing || erasing}
					>
						<option value="remove">Remove (click)</option>
						<option value="erase" disabled={!canErase}>Eraser (paint to restore)</option>
					</select>
				</Field>
				{#if resultTool === 'erase'}
					<Field id="br-eraser" label="Eraser size ({Math.round(Number(eraserSize))}px)">
						<input
							id="br-eraser"
							type="range"
							min="4"
							max="120"
							step="1"
							bind:value={eraserSize}
							disabled={processing || !canErase}
							class="w-full accent-fg"
						/>
					</Field>
				{/if}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					size="sm"
					variant="secondary"
					disabled={!canUndo || processing || erasing}
					onclick={undo}
				>
					Undo
				</Button>
				<Button
					type="button"
					size="sm"
					variant="secondary"
					disabled={!canRedo || processing || erasing}
					onclick={redo}
				>
					Redo
				</Button>
				<span class="text-xs text-muted">Ctrl/Cmd+Z · Ctrl/Cmd+Y</span>
			</div>

			<div class="rounded-md border border-border bg-bg px-3 py-3">
				<p class="text-sm font-medium text-fg">Clean up leftover dots</p>
				<p class="mt-1 text-sm text-muted">
					Magic wand often leaves stray background speckles. <strong>Clean speckles</strong> deletes
					tiny blobs; <strong>Sweep key color</strong> removes every pixel matching the key color (good
					for forest/green backgrounds).
				</p>
				<div class="mt-3 grid gap-3 sm:grid-cols-2">
					<Field
						id="br-speckle"
						label="Max speckle size ({Math.round(Number(speckleMaxSize))}px)"
						hint="Islands this size or smaller are deleted. Raise if dots remain."
					>
						<input
							id="br-speckle"
							type="range"
							min="4"
							max="800"
							step="4"
							bind:value={speckleMaxSize}
							disabled={processing}
							class="w-full accent-fg"
						/>
					</Field>
					<div class="flex flex-wrap items-end gap-2">
						<Button
							type="button"
							size="sm"
							disabled={processing || erasing || !hasResult}
							onclick={cleanSpeckles}
						>
							Clean speckles
						</Button>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							disabled={processing || erasing || !hasResult}
							onclick={sweepKeyColor}
						>
							Sweep key color
						</Button>
					</div>
				</div>
				{#if !classicMode}
					<div class="mt-3 grid gap-3 sm:grid-cols-3">
						<Field id="br-sweep-color" label="Key color for sweep">
							<div class="flex items-center gap-2">
								<input
									id="br-sweep-color-swatch"
									type="color"
									class="h-10 w-12 cursor-pointer rounded-md border border-border bg-bg p-1"
									bind:value={color}
									disabled={processing}
									aria-label="Background key color for sweep"
								/>
								<Input
									id="br-sweep-color"
									bind:value={color}
									class="font-mono text-sm"
									disabled={processing}
								/>
							</div>
						</Field>
						<Field id="br-sweep-tol" label="Tolerance ({tolerance})">
							<input
								id="br-sweep-tol"
								type="range"
								min="0"
								max="120"
								step="1"
								bind:value={tolerance}
								disabled={processing}
								class="w-full accent-fg"
							/>
						</Field>
						<Field id="br-sweep-feather" label="Feather ({feather})">
							<input
								id="br-sweep-feather"
								type="range"
								min="0"
								max="40"
								step="1"
								bind:value={feather}
								disabled={processing}
								class="w-full accent-fg"
							/>
						</Field>
					</div>
				{/if}
			</div>
		{/if}

		{#if classicMode}
			<Field id="br-color" label="Key color">
				<div class="flex items-center gap-2">
					<input
						id="br-color-swatch"
						type="color"
						class="h-10 w-12 cursor-pointer rounded-md border border-border bg-bg p-1"
						bind:value={color}
						disabled={processing}
						aria-label="Background key color"
					/>
					<Input id="br-color" bind:value={color} class="font-mono text-sm" disabled={processing} />
				</div>
			</Field>
			<div class="grid gap-3 sm:grid-cols-2">
				<Field
					id="br-tolerance"
					label="Tolerance ({tolerance})"
					hint={mode === 'wand' ? 'Affects the next remove click only.' : undefined}
				>
					<input
						id="br-tolerance"
						type="range"
						min="0"
						max="120"
						step="1"
						bind:value={tolerance}
						disabled={processing}
						class="w-full accent-fg"
					/>
				</Field>
				<Field
					id="br-feather"
					label="Feather ({feather})"
					hint={mode === 'wand' ? 'Affects the next remove click only.' : undefined}
				>
					<input
						id="br-feather"
						type="range"
						min="0"
						max="40"
						step="1"
						bind:value={feather}
						disabled={processing}
						class="w-full accent-fg"
					/>
				</Field>
			</div>
		{/if}

		{#if processing && mode === 'ai'}
			<div class="rounded-md border border-border bg-bg px-3 py-3" aria-live="polite">
				<p class="text-sm font-medium text-fg">{progressMessage}</p>
				{#if progressRatio != null}
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
						<div
							class="h-full rounded-full bg-fg transition-[width] duration-300"
							style={`width: ${Math.round(progressRatio * 100)}%`}
						></div>
					</div>
				{/if}
			</div>
		{/if}

		{#if showResultStage}
			<div class="flex flex-wrap items-center gap-3">
				<p class="text-sm font-medium text-fg">Check background</p>
				<div
					class="flex flex-wrap items-center gap-2"
					role="radiogroup"
					aria-label="Preview background"
				>
					{#each PREVIEW_BACKGROUNDS as bg (bg.id)}
						<button
							type="button"
							role="radio"
							aria-checked={previewBg === bg.id}
							aria-label={bg.label}
							title={bg.label}
							class="h-8 w-8 rounded-md border-2 transition-shadow {previewBg === bg.id
								? 'border-fg ring-2 ring-fg/30'
								: 'border-border'}"
							style={bg.swatch}
							onclick={() => (previewBg = bg.id)}
						></button>
					{/each}
				</div>
				{#if hasResult}
					<Button type="button" size="sm" variant="secondary" onclick={() => (enlargeOpen = true)}>
						View larger
					</Button>
				{/if}
			</div>
		{/if}

		<div class="grid gap-4 lg:grid-cols-2">
			<div>
				<p class="mb-2 text-sm font-medium">
					{classicMode ? 'Original — click to start over' : 'Original'}
				</p>
				{#if classicMode}
					<button
						type="button"
						class="block max-w-full cursor-crosshair rounded-md border border-border p-0 disabled:cursor-wait"
						onclick={onImageClick}
						disabled={processing}
					>
						<img
							src={sourceDataUrl}
							alt="Original — click to sample background"
							class={PREVIEW_MAX_CLASS}
							draggable="false"
						/>
					</button>
				{:else}
					<img
						src={sourceDataUrl}
						alt="Original"
						class="{PREVIEW_MAX_CLASS} rounded-md border border-border"
						draggable="false"
					/>
				{/if}
			</div>
			<div>
				<p class="mb-2 text-sm font-medium">
					{#if resultTool === 'erase' && canErase}
						Result — drag eraser to restore
					{:else if classicMode}
						{mode === 'wand' && !outputDataUrl
							? 'Result — click background to remove'
							: 'Result — click to remove more'}
					{:else}
						Result (transparent PNG)
					{/if}
				</p>
				{#if processing && mode !== 'ai'}
					<p class="text-sm text-muted">Removing background…</p>
				{:else if showResultStage}
					{#if enlargeOpen}
						<p class="text-sm text-muted">
							Editing in the larger view — close it to see the small preview again.
						</p>
					{:else}
						{@render resultStage(PREVIEW_MAX_CLASS)}
					{/if}
				{:else}
					<p class="text-sm text-muted">Preview appears when AI finishes.</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#snippet resultStage(maxClass: string)}
	<div
		bind:this={resultWrap}
		role="group"
		aria-label="Background removal result"
		class="relative inline-block max-w-full overflow-hidden rounded-md border border-border shadow-sm"
		style={previewBgStyle}
		onpointerleave={onResultPointerLeave}
	>
		<canvas
			bind:this={resultCanvas}
			class="{maxClass} touch-none {resultTool === 'erase' && canErase
				? 'cursor-none'
				: classicMode
					? 'cursor-crosshair'
					: ''}"
			onclick={onResultCanvasClick}
			onpointerdown={onResultPointerDown}
			onpointermove={onResultPointerMove}
			onpointerup={onResultPointerUp}
			onpointercancel={onResultPointerUp}
			onpointerenter={(event) => {
				if (resultTool === 'erase') {
					cursorVisible = true;
					updateEraserCursor(event);
				}
			}}
		></canvas>
		{#if resultTool === 'erase' && canErase && cursorVisible}
			<div
				class="pointer-events-none absolute rounded-full border-2 border-fg shadow-[0_0_0_1px_#fff_inset]"
				style={`left:${cursorX}px;top:${cursorY}px;width:${cursorDiameter}px;height:${cursorDiameter}px;transform:translate(-50%,-50%);`}
				aria-hidden="true"
			></div>
		{/if}
	</div>
{/snippet}

{#if enlargeOpen && hasResult}
	<div use:portal class="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4">
		<button
			type="button"
			class="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
			aria-label="Close larger preview"
			onclick={closeEnlarge}
		></button>

		<div
			class="relative z-10 flex max-h-[min(94vh,60rem)] w-[min(100%,72rem)] flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated text-fg shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Larger result preview"
			tabindex="-1"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"
			>
				<div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
					<p class="text-sm font-medium text-fg">Larger preview</p>
					<div
						class="flex items-center gap-2"
						role="radiogroup"
						aria-label="Large preview background"
					>
						{#each PREVIEW_BACKGROUNDS as bg (bg.id)}
							<button
								type="button"
								role="radio"
								aria-checked={previewBg === bg.id}
								aria-label={bg.label}
								title={bg.label}
								class="h-7 w-7 rounded-md border-2 {previewBg === bg.id
									? 'border-fg ring-2 ring-fg/30'
									: 'border-border'}"
								style={bg.swatch}
								onclick={() => (previewBg = bg.id)}
							></button>
						{/each}
					</div>
					{#if classicMode}
						<select
							class="rounded-md border border-border bg-bg px-2 py-1 text-xs"
							bind:value={resultTool}
							disabled={processing || erasing}
							aria-label="Result tool"
						>
							<option value="remove">Remove (click)</option>
							<option value="erase">Eraser</option>
						</select>
					{:else}
						<select
							class="rounded-md border border-border bg-bg px-2 py-1 text-xs"
							bind:value={resultTool}
							disabled={processing || erasing}
							aria-label="Result tool"
						>
							<option value="remove">View</option>
							<option value="erase">Eraser</option>
						</select>
					{/if}
					<div class="flex items-center gap-1">
						<Button
							type="button"
							size="sm"
							variant="secondary"
							disabled={!canUndo || processing || erasing}
							onclick={undo}
						>
							Undo
						</Button>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							disabled={!canRedo || processing || erasing}
							onclick={redo}
						>
							Redo
						</Button>
					</div>
				</div>
				<button
					type="button"
					class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-bg hover:text-fg"
					aria-label="Close"
					onclick={closeEnlarge}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			<p class="shrink-0 border-b border-border px-4 py-2 text-xs text-muted">
				{#if resultTool === 'erase'}
					Drag to restore original pixels. Undo/Redo and backgrounds work here too.
				{:else if classicMode}
					Click leftover background to remove more — same as the main result preview.
				{:else}
					Use Eraser to restore areas. AI removal isn’t click-to-cut; switch mode for that.
				{/if}
			</p>

			<!-- Check color only behind the image — not the whole dialog -->
			<div
				class="flex min-h-[min(52vh,32rem)] flex-1 items-center justify-center overflow-auto bg-bg p-4 sm:p-6"
			>
				{@render resultStage('block h-auto max-h-[min(70vh,46rem)] w-auto max-w-[min(100%,56rem)]')}
			</div>
		</div>
	</div>
{/if}
