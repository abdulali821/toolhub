import type { FileConstraints } from '$lib/utils/file';

export const MP4_FILE_CONSTRAINTS: FileConstraints = {
	maxBytes: 20 * 1024 * 1024,
	accept: 'video/mp4,.mp4',
	mimeAllowlist: ['video/mp4'],
	extensions: ['.mp4']
};

export const GIF_FILE_CONSTRAINTS: FileConstraints = {
	maxBytes: 12 * 1024 * 1024,
	accept: 'image/gif,.gif',
	mimeAllowlist: ['image/gif'],
	extensions: ['.gif']
};

export type FfmpegProgress = {
	/** 0–1 while converting (after load). */
	ratio: number;
	phase: 'loading' | 'converting';
};

type FFmpegInstance = import('@ffmpeg/ffmpeg').FFmpeg;

let ffmpeg: FFmpegInstance | null = null;
let loadPromise: Promise<FFmpegInstance> | null = null;
let progressHandler: ((progress: FfmpegProgress) => void) | undefined;

/** Lazy-load single-thread ffmpeg.wasm (browser only). */
export async function getFFmpeg(
	onProgress?: (progress: FfmpegProgress) => void
): Promise<FFmpegInstance> {
	if (typeof window === 'undefined') {
		throw new Error('Video conversion requires a browser environment');
	}

	progressHandler = onProgress;

	if (ffmpeg?.loaded) return ffmpeg;
	if (loadPromise) return loadPromise;

	loadPromise = (async () => {
		progressHandler?.({ ratio: 0, phase: 'loading' });
		const { FFmpeg } = await import('@ffmpeg/ffmpeg');
		const { toBlobURL } = await import('@ffmpeg/util');
		const instance = new FFmpeg();

		instance.on('progress', ({ progress }) => {
			progressHandler?.({
				ratio: Math.max(0, Math.min(1, progress || 0)),
				phase: 'converting'
			});
		});

		const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
		await instance.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
		});

		ffmpeg = instance;
		progressHandler?.({ ratio: 1, phase: 'loading' });
		return instance;
	})().catch((err) => {
		loadPromise = null;
		throw err instanceof Error ? err : new Error('Failed to load FFmpeg');
	});

	return loadPromise;
}

export async function bytesFromDataUrl(dataUrl: string): Promise<Uint8Array> {
	const res = await fetch(dataUrl);
	if (!res.ok) throw new Error('Failed to read file data');
	return new Uint8Array(await res.arrayBuffer());
}

export function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error('Failed to encode output'));
		reader.readAsDataURL(blob);
	});
}

export type Mp4ToGifOptions = {
	/** Source as data URL or raw bytes. */
	input: string | Uint8Array;
	fps?: number;
	maxWidth?: number;
	onProgress?: (progress: FfmpegProgress) => void;
};

/** Convert MP4 → animated GIF in the browser via ffmpeg.wasm. */
export async function convertMp4ToGif(options: Mp4ToGifOptions): Promise<Blob> {
	const fps = Math.max(4, Math.min(15, Math.round(options.fps ?? 10)));
	const maxWidth = Math.max(160, Math.min(720, Math.round(options.maxWidth ?? 480)));
	const ff = await getFFmpeg(options.onProgress);

	const inputName = 'input.mp4';
	const outputName = 'output.gif';
	const bytes =
		typeof options.input === 'string' ? await bytesFromDataUrl(options.input) : options.input;

	await ff.writeFile(inputName, bytes);

	const vf = `fps=${fps},scale='min(${maxWidth},iw)':-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer`;
	const code = await ff.exec(['-i', inputName, '-vf', vf, '-loop', '0', '-y', outputName]);
	if (code !== 0) {
		throw new Error('FFmpeg failed to convert MP4 to GIF');
	}

	const data = await ff.readFile(outputName);
	await ff.deleteFile(inputName).catch(() => undefined);
	await ff.deleteFile(outputName).catch(() => undefined);

	const out = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
	return new Blob([Uint8Array.from(out)], { type: 'image/gif' });
}

export type GifToMp4Options = {
	input: string | Uint8Array;
	onProgress?: (progress: FfmpegProgress) => void;
};

/** Convert GIF → MP4 (H.264) in the browser via ffmpeg.wasm. */
export async function convertGifToMp4(options: GifToMp4Options): Promise<Blob> {
	const ff = await getFFmpeg(options.onProgress);

	const inputName = 'input.gif';
	const outputName = 'output.mp4';
	const bytes =
		typeof options.input === 'string' ? await bytesFromDataUrl(options.input) : options.input;

	await ff.writeFile(inputName, bytes);

	const code = await ff.exec([
		'-i',
		inputName,
		'-movflags',
		'faststart',
		'-pix_fmt',
		'yuv420p',
		'-vf',
		'scale=trunc(iw/2)*2:trunc(ih/2)*2',
		'-y',
		outputName
	]);
	if (code !== 0) {
		throw new Error('FFmpeg failed to convert GIF to MP4');
	}

	const data = await ff.readFile(outputName);
	await ff.deleteFile(inputName).catch(() => undefined);
	await ff.deleteFile(outputName).catch(() => undefined);

	const out = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
	return new Blob([Uint8Array.from(out)], { type: 'video/mp4' });
}

/**
 * Remux a MediaRecorder WebM with stream-copy so Duration + cues exist.
 * Players (VLC, Edge, Windows) can then show a working progress / seek bar.
 */
export async function remuxWebmSeekable(
	blob: Blob,
	onProgress?: (progress: FfmpegProgress) => void
): Promise<Blob> {
	const type = blob.type || 'video/webm';
	const ff = await getFFmpeg(onProgress);
	const inputName = 'rec-in.webm';
	const outputName = 'rec-out.webm';
	const bytes = new Uint8Array(await blob.arrayBuffer());

	await ff.writeFile(inputName, bytes);
	const code = await ff.exec([
		'-fflags',
		'+genpts',
		'-i',
		inputName,
		'-c',
		'copy',
		'-y',
		outputName
	]);
	if (code !== 0) {
		await ff.deleteFile(inputName).catch(() => undefined);
		throw new Error('Failed to remux recording');
	}

	const data = await ff.readFile(outputName);
	await ff.deleteFile(inputName).catch(() => undefined);
	await ff.deleteFile(outputName).catch(() => undefined);

	const out = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
	return new Blob([Uint8Array.from(out)], { type });
}
