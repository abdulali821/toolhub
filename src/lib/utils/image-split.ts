/** Pure layout + canvas helpers for splitting images into tiles. */

export type SplitDirection = 'vertical' | 'horizontal' | 'grid';
export type SplitMeasure = 'count' | 'size';
export type SplitOutputFormat = 'same' | 'image/png' | 'image/jpeg' | 'image/webp';

export type SplitAxisInput = {
	measure: SplitMeasure;
	/** Used when measure is count (>= 1). */
	count: number;
	/** Used when measure is size (>= 1 px). */
	size: number;
	/** Overlap between adjacent pieces in pixels (>= 0). */
	overlap: number;
};

export type SplitImageInput = {
	dataUrl: string;
	direction: SplitDirection;
	vertical: SplitAxisInput;
	horizontal: SplitAxisInput;
	outputFormat: SplitOutputFormat;
	quality: number;
};

export type SplitSlice = { start: number; end: number };

export type SplitPiece = {
	index: number;
	row: number;
	col: number;
	name: string;
	dataUrl: string;
	width: number;
	height: number;
};

export type SplitImageResult = {
	pieces: SplitPiece[];
	rows: number;
	cols: number;
	sourceWidth: number;
	sourceHeight: number;
};

export function computeSlicePositions(
	total: number,
	measure: SplitMeasure,
	count: number,
	size: number,
	overlap: number
): SplitSlice[] {
	const len = Math.max(1, Math.floor(total));
	const ov = Math.max(0, Math.floor(overlap));

	if (measure === 'count') {
		const n = Math.max(1, Math.floor(count));
		const slices: SplitSlice[] = [];
		for (let i = 0; i < n; i++) {
			const baseStart = Math.floor((i * len) / n);
			const baseEnd = i === n - 1 ? len : Math.floor(((i + 1) * len) / n);
			const start = i > 0 ? Math.max(0, baseStart - ov) : baseStart;
			const end = i < n - 1 ? Math.min(len, baseEnd + ov) : baseEnd;
			slices.push({ start, end: Math.max(start + 1, end) });
		}
		return slices;
	}

	const block = Math.max(1, Math.floor(size));
	const stride = Math.max(1, block - ov);
	const slices: SplitSlice[] = [];
	for (let start = 0; start < len; start += stride) {
		const end = Math.min(len, start + block);
		slices.push({ start, end: Math.max(start + 1, end) });
		if (end >= len) break;
	}
	return slices.length ? slices : [{ start: 0, end: len }];
}

export function layoutSplitSlices(
	width: number,
	height: number,
	direction: SplitDirection,
	vertical: SplitAxisInput,
	horizontal: SplitAxisInput
): { rows: SplitSlice[]; cols: SplitSlice[] } {
	if (direction === 'vertical') {
		return {
			rows: computeSlicePositions(
				height,
				vertical.measure,
				vertical.count,
				vertical.size,
				vertical.overlap
			),
			cols: [{ start: 0, end: width }]
		};
	}
	if (direction === 'horizontal') {
		return {
			rows: [{ start: 0, end: height }],
			cols: computeSlicePositions(
				width,
				horizontal.measure,
				horizontal.count,
				horizontal.size,
				horizontal.overlap
			)
		};
	}
	return {
		rows: computeSlicePositions(
			height,
			vertical.measure,
			vertical.count,
			vertical.size,
			vertical.overlap
		),
		cols: computeSlicePositions(
			width,
			horizontal.measure,
			horizontal.count,
			horizontal.size,
			horizontal.overlap
		)
	};
}

export function mimeFromDataUrl(dataUrl: string): string {
	const match = dataUrl.match(/^data:([^;,]+)/);
	return match?.[1] ?? 'image/png';
}

export function resolveOutputMime(dataUrl: string, format: SplitOutputFormat): string {
	if (format === 'same') {
		const mime = mimeFromDataUrl(dataUrl);
		if (mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/png') return mime;
		return 'image/png';
	}
	return format;
}

export function extensionForMime(mime: string): string {
	if (mime === 'image/jpeg') return 'jpg';
	if (mime === 'image/webp') return 'webp';
	return 'png';
}

export function pieceFilename(baseName: string, row: number, col: number, ext: string): string {
	return `${baseName}_r${row + 1}c${col + 1}.${ext}`;
}

export async function splitImage(
	input: SplitImageInput,
	baseName = 'image'
): Promise<SplitImageResult> {
	if (typeof document === 'undefined') {
		throw new Error('Image splitting requires a browser environment');
	}
	const { loadImage } = await import('./image-canvas');
	const img = await loadImage(input.dataUrl);
	const sourceWidth = img.naturalWidth;
	const sourceHeight = img.naturalHeight;
	const { rows, cols } = layoutSplitSlices(
		sourceWidth,
		sourceHeight,
		input.direction,
		input.vertical,
		input.horizontal
	);
	const mime = resolveOutputMime(input.dataUrl, input.outputFormat);
	const ext = extensionForMime(mime);
	const quality = Math.min(1, Math.max(0.1, input.quality));

	const pieces: SplitPiece[] = [];
	let index = 0;
	for (let ri = 0; ri < rows.length; ri++) {
		for (let ci = 0; ci < cols.length; ci++) {
			const row = rows[ri]!;
			const col = cols[ci]!;
			const pw = col.end - col.start;
			const ph = row.end - row.start;
			const canvas = document.createElement('canvas');
			canvas.width = pw;
			canvas.height = ph;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas is not supported in this browser');
			ctx.drawImage(img, col.start, row.start, pw, ph, 0, 0, pw, ph);
			const dataUrl =
				mime === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL(mime, quality);
			pieces.push({
				index,
				row: ri,
				col: ci,
				name: pieceFilename(baseName, ri, ci, ext),
				dataUrl,
				width: pw,
				height: ph
			});
			index += 1;
		}
	}

	return {
		pieces,
		rows: rows.length,
		cols: cols.length,
		sourceWidth,
		sourceHeight
	};
}
