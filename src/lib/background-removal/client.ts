/**
 * Browser-only AI background removal via @imgly/background-removal + onnxruntime-web.
 * Never import this module from SSR load functions — use dynamic import from client UI.
 */

import { getBackgroundRemovalAssetPath } from './config';
import { isBrowserAiRemovalSupported } from './support';

export type AiRemovalProgressPhase =
	'preparing' | 'downloading' | 'removing' | 'almost_done' | 'done';

export type AiRemovalProgress = {
	phase: AiRemovalProgressPhase;
	/** Human-readable status for the UI. */
	message: string;
	/** Optional 0–1 progress when the library reports download bytes. */
	ratio?: number;
};

export type RemoveBackgroundAiOptions = {
	/** Soft cancel: ignore result if generation no longer matches. */
	generation?: number;
	onProgress?: (progress: AiRemovalProgress) => void;
	/** Longest image side before downscale (default 2048). */
	maxSide?: number;
	/** IMG.LY model id — quint8 is smaller/faster for typical devices. */
	model?: 'isnet' | 'isnet_fp16' | 'isnet_quint8';
};

const MAX_SIDE_DEFAULT = 2048;

let jobLocked = false;
let activeGeneration = 0;
/** True after model/WASM assets have been fetched at least once this session. */
let modelAssetsReady = false;

export function beginBackgroundRemovalGeneration(): number {
	activeGeneration += 1;
	return activeGeneration;
}

export function getActiveBackgroundRemovalGeneration(): number {
	return activeGeneration;
}

export function isBackgroundRemovalModelReady(): boolean {
	return modelAssetsReady;
}

/** Invalidate in-flight AI jobs (new upload, reset, navigate away). */
export function cancelBackgroundRemovalJobs(): void {
	activeGeneration += 1;
	jobLocked = false;
}

function assertBrowser(): void {
	if (typeof window === 'undefined') {
		throw new Error('AI background removal only runs in the browser.');
	}
	if (!isBrowserAiRemovalSupported()) {
		throw new Error(
			'This browser cannot run on-device AI background removal (WebAssembly or canvas unavailable). Try a recent Chrome, Edge, Firefox, or Safari.'
		);
	}
}

function mapProgressKey(key: string, current: number, total: number): AiRemovalProgress {
	const ratio = total > 0 ? Math.min(1, current / total) : undefined;
	const lower = key.toLowerCase();

	// IMG.LY keys: `fetch:…` while pulling assets, `compute:…` while inferring.
	if (lower.startsWith('fetch:')) {
		if (modelAssetsReady || (ratio != null && ratio >= 1)) {
			return { phase: 'preparing', message: 'Loading AI…', ratio };
		}
		return {
			phase: 'downloading',
			message:
				ratio != null ? `Downloading model… ${Math.round(ratio * 100)}%` : 'Downloading model…',
			ratio
		};
	}
	if (lower.startsWith('compute:')) {
		if (lower.includes('encode') && ratio != null && ratio >= 1) {
			return { phase: 'almost_done', message: 'Almost done…', ratio };
		}
		return { phase: 'removing', message: 'Removing background…', ratio };
	}
	return {
		phase: modelAssetsReady ? 'removing' : 'preparing',
		message: modelAssetsReady ? 'Removing background…' : 'Preparing AI…',
		ratio
	};
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
	const res = await fetch(dataUrl);
	return res.blob();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ''));
		reader.onerror = () => reject(reader.error ?? new Error('Failed to read result'));
		reader.readAsDataURL(blob);
	});
}

/**
 * Downscale very large images before inference to limit memory / WASM pressure.
 * Returns a PNG blob suitable for the model.
 */
export async function prepareImageForAiRemoval(
	source: Blob | string,
	maxSide = MAX_SIDE_DEFAULT
): Promise<Blob> {
	assertBrowser();
	const blob = typeof source === 'string' ? await dataUrlToBlob(source) : source;
	const bitmap = await createImageBitmap(blob);
	try {
		const w = bitmap.width;
		const h = bitmap.height;
		const longest = Math.max(w, h);
		const scale = longest > maxSide ? maxSide / longest : 1;
		const tw = Math.max(1, Math.round(w * scale));
		const th = Math.max(1, Math.round(h * scale));
		const canvas = document.createElement('canvas');
		canvas.width = tw;
		canvas.height = th;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas is not supported in this browser');
		ctx.drawImage(bitmap, 0, 0, tw, th);
		const out = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(b) => (b ? resolve(b) : reject(new Error('Failed to encode image for AI processing'))),
				'image/png'
			);
		});
		return out;
	} finally {
		bitmap.close();
	}
}

/**
 * Remove background entirely in the browser. Returns a transparent PNG as a data URL.
 */
export async function removeBackgroundWithAi(
	source: Blob | string,
	options: RemoveBackgroundAiOptions = {}
): Promise<string> {
	assertBrowser();

	if (jobLocked) {
		throw new Error('Background removal is already running. Wait for it to finish or reset.');
	}

	const generation = options.generation ?? beginBackgroundRemovalGeneration();
	jobLocked = true;

	const report = (progress: AiRemovalProgress) => {
		if (generation !== activeGeneration) return;
		options.onProgress?.(progress);
	};

	try {
		report({
			phase: modelAssetsReady ? 'removing' : 'preparing',
			message: modelAssetsReady ? 'Removing background…' : 'Preparing AI…'
		});

		const prepared = await prepareImageForAiRemoval(source, options.maxSide ?? MAX_SIDE_DEFAULT);
		if (generation !== activeGeneration) {
			throw new Error('Cancelled');
		}

		if (!modelAssetsReady) {
			report({ phase: 'downloading', message: 'Downloading model…' });
		} else {
			report({ phase: 'removing', message: 'Removing background…' });
		}

		const { removeBackground: imglyRemoveBackground, preload } =
			await import('@imgly/background-removal');

		if (generation !== activeGeneration) {
			throw new Error('Cancelled');
		}

		const publicPath = getBackgroundRemovalAssetPath();
		const config = {
			...(publicPath ? { publicPath } : {}),
			model: options.model ?? ('isnet_quint8' as const),
			proxyToWorker: true,
			output: {
				format: 'image/png' as const
			},
			progress: (key: string, current: number, total: number) => {
				report(mapProgressKey(key, current, total));
			}
		};

		if (!modelAssetsReady) {
			await preload(config);
			if (generation !== activeGeneration) {
				throw new Error('Cancelled');
			}
			modelAssetsReady = true;
			report({ phase: 'removing', message: 'Removing background…' });
		}

		const resultBlob = await imglyRemoveBackground(prepared, config);

		if (generation !== activeGeneration) {
			throw new Error('Cancelled');
		}

		modelAssetsReady = true;
		report({ phase: 'almost_done', message: 'Almost done…' });
		const dataUrl = await blobToDataUrl(resultBlob);
		report({ phase: 'done', message: 'Background removed' });
		return dataUrl;
	} catch (err) {
		if (generation !== activeGeneration || (err instanceof Error && err.message === 'Cancelled')) {
			throw new Error('Cancelled', { cause: err });
		}
		const message = err instanceof Error ? err.message : 'AI background removal failed';
		if (/wasm|onnx|webassembly|backend|initialize/i.test(message)) {
			throw new Error(
				'Could not initialize the on-device AI engine. Try another browser, disable strict blockers, or retry.',
				{ cause: err }
			);
		}
		if (/fetch|network|download|load.*model|failed to fetch/i.test(message)) {
			throw new Error(
				'Could not download the AI model. Check your connection and retry. (Your image stayed in this browser.)',
				{ cause: err }
			);
		}
		if (/memory|allocation|out of memory/i.test(message)) {
			throw new Error('Not enough memory to process this image. Try a smaller file and retry.', {
				cause: err
			});
		}
		throw err instanceof Error ? err : new Error(message, { cause: err });
	} finally {
		if (generation === activeGeneration) {
			jobLocked = false;
		}
	}
}
