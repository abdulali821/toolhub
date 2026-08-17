import { describe, expect, it } from 'vitest';
import {
	computeSlicePositions,
	extensionForMime,
	layoutSplitSlices,
	pieceFilename,
	resolveOutputMime
} from '../../src/lib/utils/image-split';

describe('image-split utils', () => {
	it('splits height into equal rows', () => {
		expect(computeSlicePositions(900, 'count', 3, 0, 0)).toEqual([
			{ start: 0, end: 300 },
			{ start: 300, end: 600 },
			{ start: 600, end: 900 }
		]);
	});

	it('splits width into fixed-size columns with overlap', () => {
		const cols = computeSlicePositions(1000, 'size', 0, 400, 40);
		expect(cols.length).toBeGreaterThan(1);
		expect(cols[0]).toEqual({ start: 0, end: 400 });
		expect(cols[1]?.start).toBe(360);
	});

	it('builds a grid layout', () => {
		const layout = layoutSplitSlices(
			1200,
			900,
			'grid',
			{ measure: 'count', count: 2, size: 1, overlap: 0 },
			{ measure: 'count', count: 3, size: 1, overlap: 0 }
		);
		expect(layout.rows).toHaveLength(2);
		expect(layout.cols).toHaveLength(3);
	});

	it('resolves output mime and filenames', () => {
		expect(resolveOutputMime('data:image/jpeg;base64,abc', 'same')).toBe('image/jpeg');
		expect(resolveOutputMime('data:image/gif;base64,abc', 'same')).toBe('image/png');
		expect(extensionForMime('image/webp')).toBe('webp');
		expect(pieceFilename('photo', 0, 2, 'png')).toBe('photo_r1c3.png');
	});
});
