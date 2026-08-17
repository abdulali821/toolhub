export const IMAGE_FILE_CONSTRAINTS = {
	maxBytes: 2 * 1024 * 1024,
	accept: 'image/png,image/jpeg,image/gif,image/webp',
	mimeAllowlist: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
	extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp']
};

export const PNG_FILE_CONSTRAINTS = {
	maxBytes: 2 * 1024 * 1024,
	accept: 'image/png',
	mimeAllowlist: ['image/png'],
	extensions: ['.png']
};

export const JPEG_FILE_CONSTRAINTS = {
	maxBytes: 2 * 1024 * 1024,
	accept: 'image/jpeg',
	mimeAllowlist: ['image/jpeg'],
	extensions: ['.jpg', '.jpeg']
};

export const WEBP_FILE_CONSTRAINTS = {
	maxBytes: 2 * 1024 * 1024,
	accept: 'image/webp',
	mimeAllowlist: ['image/webp'],
	extensions: ['.webp']
};

export const SVG_FILE_CONSTRAINTS = {
	maxBytes: 1 * 1024 * 1024,
	accept: 'image/svg+xml,.svg',
	mimeAllowlist: ['image/svg+xml'],
	extensions: ['.svg']
};

export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = dataUrl;
	});
}

export type ResizeDimensions = {
	width: number;
	height: number;
};

export function computeResizeDimensions(
	naturalWidth: number,
	naturalHeight: number,
	targetWidth: number | null,
	targetHeight: number | null,
	keepAspect: boolean
): ResizeDimensions {
	if (!keepAspect) {
		return {
			width: targetWidth ?? naturalWidth,
			height: targetHeight ?? naturalHeight
		};
	}

	if (targetWidth && targetHeight) {
		const ratio = Math.min(targetWidth / naturalWidth, targetHeight / naturalHeight);
		return {
			width: Math.max(1, Math.round(naturalWidth * ratio)),
			height: Math.max(1, Math.round(naturalHeight * ratio))
		};
	}

	if (targetWidth) {
		const ratio = targetWidth / naturalWidth;
		return {
			width: targetWidth,
			height: Math.max(1, Math.round(naturalHeight * ratio))
		};
	}

	if (targetHeight) {
		const ratio = targetHeight / naturalHeight;
		return {
			width: Math.max(1, Math.round(naturalWidth * ratio)),
			height: targetHeight
		};
	}

	return { width: naturalWidth, height: naturalHeight };
}

export async function drawToDataUrl(
	img: HTMLImageElement,
	width: number,
	height: number,
	mimeType: string,
	quality?: number,
	fillBackground?: string
): Promise<string> {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	if (fillBackground) {
		ctx.fillStyle = fillBackground;
		ctx.fillRect(0, 0, width, height);
	}

	ctx.drawImage(img, 0, 0, width, height);
	return canvas.toDataURL(mimeType, quality);
}

export async function compressImage(
	dataUrl: string,
	quality: number,
	mimeType: 'image/jpeg' | 'image/webp',
	fillBackground?: string
): Promise<string> {
	const img = await loadImage(dataUrl);
	return drawToDataUrl(img, img.naturalWidth, img.naturalHeight, mimeType, quality, fillBackground);
}

export async function resizeImage(
	dataUrl: string,
	targetWidth: number | null,
	targetHeight: number | null,
	keepAspect: boolean,
	mimeType = 'image/png'
): Promise<{ dataUrl: string; width: number; height: number }> {
	const img = await loadImage(dataUrl);
	const { width, height } = computeResizeDimensions(
		img.naturalWidth,
		img.naturalHeight,
		targetWidth,
		targetHeight,
		keepAspect
	);
	const out = await drawToDataUrl(img, width, height, mimeType);
	return { dataUrl: out, width, height };
}

export type CropRect = { x: number; y: number; width: number; height: number };

export async function cropImage(
	dataUrl: string,
	crop: CropRect,
	mimeType = 'image/png',
	quality?: number
): Promise<string> {
	const img = await loadImage(dataUrl);
	const x = Math.max(0, Math.min(Math.floor(crop.x), img.naturalWidth - 1));
	const y = Math.max(0, Math.min(Math.floor(crop.y), img.naturalHeight - 1));
	const width = Math.max(1, Math.min(Math.floor(crop.width), img.naturalWidth - x));
	const height = Math.max(1, Math.min(Math.floor(crop.height), img.naturalHeight - y));

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');
	ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
	return canvas.toDataURL(mimeType, quality);
}

export async function rotateImage(
	dataUrl: string,
	degrees: 90 | 180 | 270,
	mimeType = 'image/png',
	quality?: number
): Promise<string> {
	const img = await loadImage(dataUrl);
	const swap = degrees === 90 || degrees === 270;
	const canvas = document.createElement('canvas');
	canvas.width = swap ? img.naturalHeight : img.naturalWidth;
	canvas.height = swap ? img.naturalWidth : img.naturalHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate((degrees * Math.PI) / 180);
	ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
	return canvas.toDataURL(mimeType, quality);
}

export async function flipImage(
	dataUrl: string,
	axis: 'horizontal' | 'vertical' | 'both',
	mimeType = 'image/png',
	quality?: number
): Promise<string> {
	const img = await loadImage(dataUrl);
	const canvas = document.createElement('canvas');
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas is not supported in this browser');

	const sx = axis === 'vertical' ? 1 : -1;
	const sy = axis === 'horizontal' ? 1 : -1;
	ctx.translate(axis === 'vertical' ? 0 : canvas.width, axis === 'horizontal' ? 0 : canvas.height);
	ctx.scale(sx, sy);
	ctx.drawImage(img, 0, 0);
	return canvas.toDataURL(mimeType, quality);
}

export async function convertImageFormat(
	dataUrl: string,
	format: 'png' | 'jpeg' | 'webp',
	quality = 0.92
): Promise<string> {
	const img = await loadImage(dataUrl);
	const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
	const fill = format === 'jpeg' ? '#ffffff' : undefined;
	return drawToDataUrl(img, img.naturalWidth, img.naturalHeight, mime, quality, fill);
}

/** Lightweight SVG cleanup: strip comments, collapse whitespace between tags. */
export function optimizeSvg(source: string): {
	svg: string;
	originalBytes: number;
	optimizedBytes: number;
} {
	const originalBytes = new TextEncoder().encode(source).length;
	let svg = source.replace(/<!--[\s\S]*?-->/g, '');
	svg = svg.replace(/>\s+</g, '><');
	svg = svg.replace(/\s{2,}/g, ' ');
	svg = svg.trim();
	const optimizedBytes = new TextEncoder().encode(svg).length;
	return { svg, originalBytes, optimizedBytes };
}

export type ImageMetaField = { key: string; value: string };

export function readImageMetadata(
	bytes: Uint8Array,
	fileName: string,
	mimeType: string
): ImageMetaField[] {
	const fields: ImageMetaField[] = [
		{ key: 'File name', value: fileName },
		{ key: 'MIME type', value: mimeType || 'unknown' },
		{ key: 'File size', value: `${bytes.length} bytes` }
	];

	if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
		const width = (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!;
		const height = (bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!;
		fields.push({ key: 'Format', value: 'PNG' });
		fields.push({ key: 'Width', value: String(width) });
		fields.push({ key: 'Height', value: String(height) });
		return fields;
	}

	if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
		fields.push({ key: 'Format', value: 'JPEG' });
		const dims = readJpegDimensions(bytes);
		if (dims) {
			fields.push({ key: 'Width', value: String(dims.width) });
			fields.push({ key: 'Height', value: String(dims.height) });
		}
		fields.push({
			key: 'EXIF',
			value: hasJpegExif(bytes) ? 'Present (basic detection)' : 'Not detected'
		});
		return fields;
	}

	if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[8] === 0x57) {
		fields.push({ key: 'Format', value: 'WebP' });
		const dims = readWebpDimensions(bytes);
		if (dims) {
			fields.push({ key: 'Width', value: String(dims.width) });
			fields.push({ key: 'Height', value: String(dims.height) });
		}
		return fields;
	}

	fields.push({ key: 'Format', value: 'Unknown / unsupported for dimension parse' });
	return fields;
}

function hasJpegExif(bytes: Uint8Array): boolean {
	let offset = 2;
	while (offset + 4 < bytes.length) {
		if (bytes[offset] !== 0xff) break;
		const marker = bytes[offset + 1]!;
		const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
		if (marker === 0xe1) return true;
		offset += 2 + length;
	}
	return false;
}

function readJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
	let offset = 2;
	while (offset + 9 < bytes.length) {
		if (bytes[offset] !== 0xff) break;
		const marker = bytes[offset + 1]!;
		const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
		if (marker >= 0xc0 && marker <= 0xc3) {
			const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!;
			const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!;
			return { width, height };
		}
		offset += 2 + length;
	}
	return null;
}

function readWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
	// VP8X
	if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
		const width = 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16));
		const height = 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16));
		return { width, height };
	}
	// VP8 lossy
	if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
		const width = bytes[26]! | ((bytes[27]! & 0x3f) << 8);
		const height = bytes[28]! | ((bytes[29]! & 0x3f) << 8);
		return { width, height };
	}
	return null;
}

export type RemoveBackgroundCanvasOptions = {
	mode: 'color' | 'wand';
	/** Hex color for color-key mode (#rrggbb). Ignored for wand (uses seed pixel). */
	color?: string;
	tolerance: number;
	feather: number;
	seedX?: number;
	seedY?: number;
};

/** Non-AI background removal via color key or magic-wand flood fill. Returns PNG data URL. */
export async function removeBackground(
	dataUrl: string,
	options: RemoveBackgroundCanvasOptions
): Promise<string> {
	const { parseHexColor, removeBackgroundFromRgba } = await import('./background-remove');
	const img = await loadImage(dataUrl);
	const canvas = document.createElement('canvas');
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('Canvas is not supported in this browser');
	ctx.drawImage(img, 0, 0);
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	let target: { r: number; g: number; b: number };
	if (options.mode === 'color') {
		target = parseHexColor(options.color ?? '#ffffff');
	} else {
		const sx = Math.floor(options.seedX ?? 0);
		const sy = Math.floor(options.seedY ?? 0);
		const i = (sy * canvas.width + sx) * 4;
		target = {
			r: imageData.data[i]!,
			g: imageData.data[i + 1]!,
			b: imageData.data[i + 2]!
		};
	}

	removeBackgroundFromRgba(imageData.data, canvas.width, canvas.height, {
		mode: options.mode,
		target,
		tolerance: options.tolerance,
		feather: options.feather,
		seedX: options.seedX,
		seedY: options.seedY
	});
	ctx.putImageData(imageData, 0, 0);
	return canvas.toDataURL('image/png');
}

/** Sample an opaque RGB color from a data URL at image-space coordinates. */
export async function sampleImageColor(
	dataUrl: string,
	x: number,
	y: number
): Promise<{ hex: string; r: number; g: number; b: number }> {
	const { rgbToHex } = await import('./background-remove');
	const img = await loadImage(dataUrl);
	const canvas = document.createElement('canvas');
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('Canvas is not supported in this browser');
	ctx.drawImage(img, 0, 0);
	const sx = Math.max(0, Math.min(canvas.width - 1, Math.floor(x)));
	const sy = Math.max(0, Math.min(canvas.height - 1, Math.floor(y)));
	const { data } = ctx.getImageData(sx, sy, 1, 1);
	const r = data[0]!;
	const g = data[1]!;
	const b = data[2]!;
	return { hex: rgbToHex(r, g, b), r, g, b };
}

export type ExtractedColor = { hex: string; count: number; percent: number };

/** Simple bucketed palette extraction (browser canvas). */
export async function extractDominantColors(
	dataUrl: string,
	maxColors = 6
): Promise<ExtractedColor[]> {
	const img = await loadImage(dataUrl);
	const maxSide = 120;
	const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
	const w = Math.max(1, Math.round(img.naturalWidth * scale));
	const h = Math.max(1, Math.round(img.naturalHeight * scale));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('Canvas is not supported in this browser');
	ctx.drawImage(img, 0, 0, w, h);
	const { data } = ctx.getImageData(0, 0, w, h);
	const buckets = new Map<string, number>();
	const step = 4;
	for (let i = 0; i < data.length; i += 4 * step) {
		const a = data[i + 3]!;
		if (a < 128) continue;
		const r = data[i]! >> 4;
		const g = data[i + 1]! >> 4;
		const b = data[i + 2]! >> 4;
		const key = `${r},${g},${b}`;
		buckets.set(key, (buckets.get(key) ?? 0) + 1);
	}
	const total = [...buckets.values()].reduce((a, b) => a + b, 0) || 1;
	return [...buckets.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, maxColors)
		.map(([key, count]) => {
			const [r, g, b] = key.split(',').map((n) => Number(n) * 17);
			const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
			return { hex, count, percent: Math.round((count / total) * 1000) / 10 };
		});
}
