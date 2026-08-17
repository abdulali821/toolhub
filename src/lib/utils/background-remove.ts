/** Pure pixel algorithms for non-AI background removal (color key + magic wand). */

export type BackgroundRemoveMode = 'color' | 'wand';

export type BackgroundRemoveOptions = {
	mode: BackgroundRemoveMode;
	/** Target RGB for color-key mode (0–255 each). */
	target: { r: number; g: number; b: number };
	/** Max per-channel difference (Chebyshev) for a hard match. 0–255. */
	tolerance: number;
	/** Soft edge width beyond tolerance (same units). 0–64. */
	feather: number;
	/** Seed pixel for wand mode (image coordinates). */
	seedX?: number;
	seedY?: number;
};

export function clampByte(n: number): number {
	return Math.max(0, Math.min(255, Math.round(n)));
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
	const raw = hex.trim().replace(/^#/, '');
	const full =
		raw.length === 3
			? raw
					.split('')
					.map((c) => c + c)
					.join('')
			: raw;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) {
		throw new Error('Color must be a hex value like #ffffff');
	}
	return {
		r: parseInt(full.slice(0, 2), 16),
		g: parseInt(full.slice(2, 4), 16),
		b: parseInt(full.slice(4, 6), 16)
	};
}

export function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b].map((n) => clampByte(n).toString(16).padStart(2, '0')).join('')}`;
}

/** Chebyshev distance in RGB space. */
export function colorDistance(
	r1: number,
	g1: number,
	b1: number,
	r2: number,
	g2: number,
	b2: number
): number {
	return Math.max(Math.abs(r1 - r2), Math.abs(g1 - g2), Math.abs(b1 - b2));
}

/**
 * Soft alpha multiplier for a pixel at distance `d` from the target color.
 * 0 = fully remove, 1 = keep.
 */
export function softAlphaFactor(d: number, tolerance: number, feather: number): number {
	if (d <= tolerance) return 0;
	if (feather <= 0 || d >= tolerance + feather) return 1;
	return (d - tolerance) / feather;
}

/**
 * Mutates `data` (RGBA ImageData buffer) in place: removes matching background pixels.
 * Returns count of pixels fully or partially affected.
 */
export function removeBackgroundFromRgba(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	options: BackgroundRemoveOptions
): { affected: number } {
	const { mode, target, tolerance, feather } = options;
	const tol = clampByte(tolerance);
	const soft = Math.max(0, Math.min(64, Math.round(feather)));
	const limit = tol + soft;

	if (mode === 'color') {
		let affected = 0;
		for (let i = 0; i < data.length; i += 4) {
			const a = data[i + 3]!;
			if (a === 0) continue;
			const d = colorDistance(data[i]!, data[i + 1]!, data[i + 2]!, target.r, target.g, target.b);
			if (d > limit) continue;
			const factor = softAlphaFactor(d, tol, soft);
			const next = Math.round(a * factor);
			if (next !== a) {
				data[i + 3] = next;
				affected += 1;
			}
		}
		return { affected };
	}

	const seedX = Math.floor(options.seedX ?? 0);
	const seedY = Math.floor(options.seedY ?? 0);
	if (seedX < 0 || seedY < 0 || seedX >= width || seedY >= height) {
		throw new Error('Click a point on the image to sample the background');
	}

	const seedIdx = (seedY * width + seedX) * 4;
	if (data[seedIdx + 3]! === 0) {
		throw new Error('Click a visible area — transparent pixels cannot be sampled.');
	}
	const sr = data[seedIdx]!;
	const sg = data[seedIdx + 1]!;
	const sb = data[seedIdx + 2]!;

	const visited = new Uint8Array(width * height);
	const queue: number[] = [seedY * width + seedX];
	visited[seedY * width + seedX] = 1;
	const mask: number[] = [];

	while (queue.length) {
		const p = queue.pop()!;
		const x = p % width;
		const y = (p - x) / width;
		const i = p * 4;
		if (data[i + 3]! === 0) continue;
		const d = colorDistance(data[i]!, data[i + 1]!, data[i + 2]!, sr, sg, sb);
		if (d > tol) continue;
		mask.push(p);

		const neighbors = [
			x > 0 ? p - 1 : -1,
			x + 1 < width ? p + 1 : -1,
			y > 0 ? p - width : -1,
			y + 1 < height ? p + width : -1
		];
		for (const n of neighbors) {
			if (n < 0 || visited[n]) continue;
			if (data[n * 4 + 3]! === 0) continue;
			visited[n] = 1;
			queue.push(n);
		}
	}

	let affected = 0;
	for (const p of mask) {
		const i = p * 4;
		const a = data[i + 3]!;
		if (a === 0) continue;
		const d = colorDistance(data[i]!, data[i + 1]!, data[i + 2]!, sr, sg, sb);
		const factor = softAlphaFactor(d, tol, soft);
		const next = Math.round(a * factor);
		if (next !== a) {
			data[i + 3] = next;
			affected += 1;
		}
	}
	return { affected };
}
