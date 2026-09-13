import { loadImage, SVG_FILE_CONSTRAINTS } from '$lib/utils/image-canvas';

export { SVG_FILE_CONSTRAINTS };

export type SvgToGifOptions = {
	/** SVG as a data URL (`data:image/svg+xml…`) or raw SVG markup. */
	svg: string;
	/** Output width in px (height follows aspect). */
	width?: number;
	/** Frames in a short loop (1 = still GIF). */
	frames?: number;
	/** Delay per frame in ms. */
	delayMs?: number;
	/** Gentle pulse scale animation when frames > 1. */
	pulse?: boolean;
};

function toSvgDataUrl(svg: string): string {
	if (svg.startsWith('data:')) return svg;
	const trimmed = svg.trim();
	if (trimmed.startsWith('<')) {
		return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
	}
	return svg;
}

/** Rasterize an SVG and encode a (optionally pulsed) GIF with gifenc. */
export async function convertSvgToGif(options: SvgToGifOptions): Promise<Blob> {
	if (typeof document === 'undefined') {
		throw new Error('SVG to GIF requires a browser environment');
	}

	const width = Math.max(32, Math.min(1200, Math.round(options.width ?? 480)));
	const frames = Math.max(1, Math.min(24, Math.round(options.frames ?? 8)));
	const delay = Math.max(40, Math.min(400, Math.round(options.delayMs ?? 80)));
	const pulse = options.pulse ?? frames > 1;

	const img = await loadImage(toSvgDataUrl(options.svg));
	const aspect = img.naturalHeight / Math.max(1, img.naturalWidth);
	const height = Math.max(1, Math.round(width * aspect));

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
	const gif = GIFEncoder();
	let palette: number[][] | null = null;

	for (let i = 0; i < frames; i++) {
		const t = frames === 1 ? 0 : i / frames;
		const scale = pulse ? 0.92 + 0.08 * Math.sin(t * Math.PI * 2) : 1;
		const dw = width * scale;
		const dh = height * scale;
		const dx = (width - dw) / 2;
		const dy = (height - dh) / 2;

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, width, height);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(img, dx, dy, dw, dh);

		const { data } = ctx.getImageData(0, 0, width, height);
		if (!palette) {
			palette = quantize(data, 256, { format: 'rgb565' });
		}
		const index = applyPalette(data, palette, 'rgb565');
		gif.writeFrame(index, width, height, {
			palette,
			delay,
			repeat: 0
		});
	}

	gif.finish();
	return new Blob([Uint8Array.from(gif.bytes())], { type: 'image/gif' });
}
