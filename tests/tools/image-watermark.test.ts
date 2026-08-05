import { describe, expect, it } from 'vitest';
import { computeWatermarkPosition } from '../../src/lib/tools/image-watermark';

describe('image-watermark', () => {
	it('centers watermark text', () => {
		expect(computeWatermarkPosition(200, 100, 40, 20, 'center')).toEqual({ x: 80, y: 40 });
	});

	it('places watermark in each corner with margin', () => {
		expect(computeWatermarkPosition(200, 100, 40, 20, 'top-left', 10)).toEqual({ x: 10, y: 10 });
		expect(computeWatermarkPosition(200, 100, 40, 20, 'top-right', 10)).toEqual({ x: 150, y: 10 });
		expect(computeWatermarkPosition(200, 100, 40, 20, 'bottom-left', 10)).toEqual({
			x: 10,
			y: 70
		});
		expect(computeWatermarkPosition(200, 100, 40, 20, 'bottom-right', 10)).toEqual({
			x: 150,
			y: 70
		});
	});
});
