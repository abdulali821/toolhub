/** Post-removal cleanup: stray speckles + global color sweep. */

import { colorDistance, softAlphaFactor } from './background-remove';

function isOpaque(alpha: number, threshold: number): boolean {
	return alpha > threshold;
}

/**
 * Remove tiny disconnected opaque blobs (leftover background dots after magic wand).
 * Keeps large regions (your subject); deletes islands at or below maxIslandPixels.
 */
export function removeSmallOpaqueIslands(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	maxIslandPixels: number,
	alphaThreshold = 16
): { removedIslands: number; removedPixels: number } {
	const limit = Math.max(1, Math.floor(maxIslandPixels));
	const visited = new Uint8Array(width * height);
	let removedIslands = 0;
	let removedPixels = 0;

	for (let p = 0; p < width * height; p++) {
		if (visited[p]) continue;
		const ai = p * 4 + 3;
		if (!isOpaque(data[ai]!, alphaThreshold)) {
			visited[p] = 1;
			continue;
		}

		const queue: number[] = [p];
		const component: number[] = [];
		visited[p] = 1;

		while (queue.length) {
			const cur = queue.pop()!;
			component.push(cur);
			const x = cur % width;
			const y = (cur - x) / width;
			const neighbors = [
				x > 0 ? cur - 1 : -1,
				x + 1 < width ? cur + 1 : -1,
				y > 0 ? cur - width : -1,
				y + 1 < height ? cur + width : -1
			];
			for (const n of neighbors) {
				if (n < 0 || visited[n]) continue;
				if (!isOpaque(data[n * 4 + 3]!, alphaThreshold)) {
					visited[n] = 1;
					continue;
				}
				visited[n] = 1;
				queue.push(n);
			}
		}

		if (component.length <= limit) {
			removedIslands += 1;
			for (const px of component) {
				const i = px * 4;
				if (data[i + 3]! > 0) {
					data[i + 3] = 0;
					removedPixels += 1;
				}
			}
		}
	}

	return { removedIslands, removedPixels };
}

/** Remove every pixel matching target color (not just connected regions). */
export function removeGlobalColorFromRgba(
	data: Uint8ClampedArray,
	target: { r: number; g: number; b: number },
	tolerance: number,
	feather: number
): { affected: number } {
	const tol = Math.max(0, Math.min(255, Math.round(tolerance)));
	const soft = Math.max(0, Math.min(64, Math.round(feather)));
	const limit = tol + soft;
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

export function parseHexTarget(hex: string): { r: number; g: number; b: number } {
	const raw = hex.trim().replace(/^#/, '');
	const full =
		raw.length === 3
			? raw
					.split('')
					.map((c) => c + c)
					.join('')
			: raw;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) {
		return { r: 255, g: 255, b: 255 };
	}
	return {
		r: parseInt(full.slice(0, 2), 16),
		g: parseInt(full.slice(2, 4), 16),
		b: parseInt(full.slice(4, 6), 16)
	};
}
