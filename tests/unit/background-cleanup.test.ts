import { describe, expect, it } from 'vitest';
import {
	removeGlobalColorFromRgba,
	removeSmallOpaqueIslands
} from '../../src/lib/utils/background-cleanup';

describe('background-cleanup', () => {
	it('removes tiny opaque islands but keeps the large blob', () => {
		const data = new Uint8ClampedArray(5 * 5 * 4);
		const set = (x: number, y: number, a: number) => {
			const i = (y * 5 + x) * 4;
			data[i] = 0;
			data[i + 1] = 128;
			data[i + 2] = 0;
			data[i + 3] = a;
		};
		for (let y = 1; y <= 3; y++) {
			for (let x = 1; x <= 3; x++) set(x, y, 255);
		}
		set(0, 0, 255);
		set(4, 4, 255);
		const { removedIslands, removedPixels } = removeSmallOpaqueIslands(data, 5, 5, 2);
		expect(removedIslands).toBe(2);
		expect(removedPixels).toBe(2);
		expect(data[3]).toBe(0);
		expect(data[99]).toBe(0);
		expect(data[51]).toBe(255);
	});

	it('sweeps matching color globally', () => {
		const data = new Uint8ClampedArray([255, 255, 255, 255, 250, 250, 250, 255, 255, 0, 0, 255]);
		const { affected } = removeGlobalColorFromRgba(data, { r: 255, g: 255, b: 255 }, 10, 0);
		expect(affected).toBe(2);
		expect(data[3]).toBe(0);
		expect(data[7]).toBe(0);
		expect(data[11]).toBe(255);
	});
});
