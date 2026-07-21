import { describe, expect, it } from 'vitest';
import { computeResizeDimensions } from '../../src/lib/utils/image-canvas';
import { imageResizer } from '../../src/lib/tools/image-resizer';

describe('image-resizer', () => {
	it('computes fit within width and height', () => {
		const dims = computeResizeDimensions(1600, 900, 800, 800, true);
		expect(dims.width).toBe(800);
		expect(dims.height).toBe(450);
	});

	it('wires workflow to crop, rotate, and compressor', () => {
		expect(imageResizer.workflow?.next).toEqual(['crop-image', 'rotate-image', 'image-compressor']);
	});
});
