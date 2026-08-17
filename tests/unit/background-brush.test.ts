import { describe, expect, it } from 'vitest';
import { restoreCircleFromRgba, restoreStrokeFromRgba } from '../../src/lib/utils/background-brush';

describe('background-brush', () => {
	it('restores source pixels inside a circle', () => {
		const source = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0, 0, 255, 0, 255, 0, 0, 0, 0]);
		const output = new Uint8ClampedArray(source);
		output[3] = 0;
		output[7] = 0;
		output[11] = 0;
		output[15] = 0;
		const restored = restoreCircleFromRgba(output, source, 2, 2, 0, 0, 1);
		expect(restored).toBeGreaterThan(0);
		expect(output[3]).toBe(255);
		expect(output[7]).toBe(0);
	});

	it('stamps along a stroke segment', () => {
		const source = new Uint8ClampedArray(4 * 5);
		source.fill(200);
		for (let i = 3; i < source.length; i += 4) source[i] = 255;
		const output = new Uint8ClampedArray(source);
		for (let i = 3; i < output.length; i += 4) output[i] = 0;
		restoreStrokeFromRgba(output, source, 5, 1, 0, 0, 4, 0, 0.75);
		expect(output[3]).toBe(255);
		expect(output[19]).toBe(255);
	});
});
