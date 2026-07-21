import { describe, expect, it } from 'vitest';
import { computeResizeDimensions } from '../../src/lib/utils/image-canvas';
import { imageCompressor } from '../../src/lib/tools/image-compressor';

describe('image-compressor', () => {
	it('declares upload capabilities without share', () => {
		expect(imageCompressor.capabilities).toContain('upload');
		expect(imageCompressor.capabilities).toContain('download');
		expect(imageCompressor.capabilities).not.toContain('share');
		expect(imageCompressor.file?.maxBytes).toBe(2 * 1024 * 1024);
	});

	it('keeps aspect ratio when resizing dimensions are computed', () => {
		const dims = computeResizeDimensions(800, 600, 400, null, true);
		expect(dims.width).toBe(400);
		expect(dims.height).toBe(300);
	});
});
