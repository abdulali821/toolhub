/** Paint original pixels back onto a cut-out (restore / eraser brush). */

export function restoreCircleFromRgba(
	output: Uint8ClampedArray,
	source: Uint8ClampedArray,
	width: number,
	height: number,
	cx: number,
	cy: number,
	radius: number
): number {
	const r = Math.max(1, radius);
	const r2 = r * r;
	let restored = 0;
	const minY = Math.max(0, Math.floor(cy - r));
	const maxY = Math.min(height - 1, Math.ceil(cy + r));
	const minX = Math.max(0, Math.floor(cx - r));
	const maxX = Math.min(width - 1, Math.ceil(cx + r));

	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			const dx = x - cx;
			const dy = y - cy;
			if (dx * dx + dy * dy > r2) continue;
			const i = (y * width + x) * 4;
			output[i] = source[i]!;
			output[i + 1] = source[i + 1]!;
			output[i + 2] = source[i + 2]!;
			output[i + 3] = source[i + 3]!;
			restored += 1;
		}
	}
	return restored;
}

/** Stamp circles along a segment so fast drags don't leave gaps. */
export function restoreStrokeFromRgba(
	output: Uint8ClampedArray,
	source: Uint8ClampedArray,
	width: number,
	height: number,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	radius: number
): number {
	const dist = Math.hypot(x1 - x0, y1 - y0);
	const steps = Math.max(1, Math.ceil(dist / Math.max(1, radius * 0.45)));
	let restored = 0;
	for (let step = 0; step <= steps; step++) {
		const t = step / steps;
		restored += restoreCircleFromRgba(
			output,
			source,
			width,
			height,
			x0 + (x1 - x0) * t,
			y0 + (y1 - y0) * t,
			radius
		);
	}
	return restored;
}
