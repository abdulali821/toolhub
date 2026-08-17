/** Layout + pixel helpers for tiling / seamless preview (no DOM). */

export type TilePattern = 'repeat' | 'mirror' | 'brick';
export type SeamlessMode = 'off' | 'offset' | 'blend';

export type TileCell = {
	col: number;
	row: number;
	flipX: boolean;
	flipY: boolean;
	/** Extra x offset in tile-widths (0.5 for odd brick rows). */
	shiftX: number;
};

export function tileCell(col: number, row: number, pattern: TilePattern): TileCell {
	if (pattern === 'mirror') {
		return {
			col,
			row,
			flipX: col % 2 !== 0,
			flipY: row % 2 !== 0,
			shiftX: 0
		};
	}
	if (pattern === 'brick') {
		return {
			col,
			row,
			flipX: false,
			flipY: false,
			shiftX: row % 2 !== 0 ? 0.5 : 0
		};
	}
	return { col, row, flipX: false, flipY: false, shiftX: 0 };
}

/** Smallest repeat unit (in tiles) so CSS-style `repeat` matches the pattern. */
export function patternUnitSize(pattern: TilePattern): { cols: number; rows: number } {
	if (pattern === 'mirror') return { cols: 2, rows: 2 };
	if (pattern === 'brick') return { cols: 2, rows: 2 };
	return { cols: 1, rows: 1 };
}

/**
 * Fit an N×N packed tile grid inside maxWidth × maxHeight without cropping cells.
 * Scale is limited by the tighter axis so portrait tiles are not clipped.
 */
export function previewGridLayout(
	tileWidth: number,
	tileHeight: number,
	gap: number,
	cols: number,
	maxWidth: number,
	maxHeight: number
): {
	width: number;
	height: number;
	scale: number;
	tileWidth: number;
	tileHeight: number;
	gap: number;
} {
	const n = Math.max(1, Math.round(cols));
	const g = Math.max(0, gap);
	const gridW = n * tileWidth + (n - 1) * g;
	const gridH = n * tileHeight + (n - 1) * g;
	const scale = Math.min(maxWidth / Math.max(1, gridW), maxHeight / Math.max(1, gridH));
	const scaledTileW = Math.max(1, Math.round(tileWidth * scale));
	const scaledTileH = Math.max(1, Math.round(tileHeight * scale));
	const scaledGap = Math.round(g * scale);
	return {
		scale,
		tileWidth: scaledTileW,
		tileHeight: scaledTileH,
		gap: scaledGap,
		width: n * scaledTileW + (n - 1) * scaledGap,
		height: n * scaledTileH + (n - 1) * scaledGap
	};
}

/** Pixel size of one packed repeating unit (trailing gap stripped). */
export function repeatingUnitPixelSize(
	tileWidth: number,
	tileHeight: number,
	gap: number,
	pattern: TilePattern
): { width: number; height: number } {
	const unit = patternUnitSize(pattern);
	const stepX = tileWidth + gap;
	const stepY = tileHeight + gap;
	const width = unit.cols * stepX - (gap > 0 ? gap : 0);
	const height = unit.rows * stepY - (gap > 0 ? gap : 0);
	return { width: Math.max(1, width), height: Math.max(1, height) };
}

export function forEachTiledCell(
	tileWidth: number,
	tileHeight: number,
	pattern: TilePattern,
	gap: number,
	outWidth: number,
	outHeight: number,
	fn: (cell: { x: number; y: number; flipX: boolean; flipY: boolean }) => void
): void {
	const stepX = tileWidth + gap;
	const stepY = tileHeight + gap;
	const extra = pattern === 'brick' ? 1 : 0;
	const cols = Math.ceil(outWidth / Math.max(1, stepX)) + 1 + extra;
	const rows = Math.ceil(outHeight / Math.max(1, stepY)) + 1;

	for (let row = 0; row < rows; row++) {
		for (let col = -extra; col < cols; col++) {
			const cell = tileCell(col, row, pattern);
			fn({
				x: col * stepX + cell.shiftX * stepX,
				y: row * stepY,
				flipX: cell.flipX,
				flipY: cell.flipY
			});
		}
	}
}

export function wrapIndex(i: number, size: number): number {
	const m = i % size;
	return m < 0 ? m + size : m;
}

/** Wrap-offset ImageData by dx/dy pixels (classic Photoshop Offset). Mutates in place via copy. */
export function wrapOffsetRgba(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	dx: number,
	dy: number
): void {
	const copy = new Uint8ClampedArray(data);
	const shiftX = wrapIndex(Math.round(dx), width);
	const shiftY = wrapIndex(Math.round(dy), height);
	for (let y = 0; y < height; y++) {
		const sy = wrapIndex(y - shiftY, height);
		for (let x = 0; x < width; x++) {
			const sx = wrapIndex(x - shiftX, width);
			const di = (y * width + x) * 4;
			const si = (sy * width + sx) * 4;
			data[di] = copy[si]!;
			data[di + 1] = copy[si + 1]!;
			data[di + 2] = copy[si + 2]!;
			data[di + 3] = copy[si + 3]!;
		}
	}
}

/**
 * Soft-blend a vertical and horizontal seam at the center (use after 50% wrap-offset).
 * feather is half-width in pixels.
 */
export function blendCenterSeams(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	feather: number
): void {
	const f = Math.max(1, Math.min(Math.floor(Math.min(width, height) / 4), Math.round(feather)));
	const cx = Math.floor(width / 2);
	const cy = Math.floor(height / 2);
	const src = new Uint8ClampedArray(data);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const dx = Math.abs(x - cx);
			const dy = Math.abs(y - cy);
			let t = 0;
			if (dx < f) t = Math.max(t, 1 - dx / f);
			if (dy < f) t = Math.max(t, 1 - dy / f);
			if (t <= 0) continue;
			t *= 0.5;
			const i = (y * width + x) * 4;
			const mx = wrapIndex(x + Math.floor(width / 2), width);
			const my = wrapIndex(y + Math.floor(height / 2), height);
			const mi = (my * width + mx) * 4;
			for (let c = 0; c < 4; c++) {
				const a = src[i + c]!;
				const b = src[mi + c]!;
				data[i + c] = Math.round(a * (1 - t) + b * t);
			}
		}
	}
}
