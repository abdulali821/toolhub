import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/aspect-ratio-calculator';

const base = {
	mode: 'simplify' as const,
	width: 0,
	height: 0,
	ratioW: 0,
	ratioH: 0,
	lock: 'width' as const,
	target: 0
};

describe('aspect-ratio-calculator', () => {
	it('simplifies 1920x1080 to 16:9', () => {
		const output = run({ ...base, mode: 'simplify', width: 1920, height: 1080 });
		expect(output.ratioW).toBe(16);
		expect(output.ratioH).toBe(9);
		expect(output.ratioLabel).toBe('16:9');
		expect(output.error).toBeUndefined();
	});

	it('simplifies 4x3-style dimensions', () => {
		const output = run({ ...base, mode: 'simplify', width: 800, height: 600 });
		expect(output.ratioLabel).toBe('4:3');
	});

	it('errors when simplifying with a zero dimension', () => {
		const output = run({ ...base, mode: 'simplify', width: 100, height: 0 });
		expect(output.error).toBeDefined();
	});

	it('computes height from a 16:9 ratio and target width', () => {
		const output = run({
			...base,
			mode: 'scale',
			ratioW: 16,
			ratioH: 9,
			lock: 'width',
			target: 1280
		});
		expect(output.error).toBeUndefined();
		expect(output.width).toBe(1280);
		expect(output.height).toBeCloseTo(720, 5);
	});

	it('computes width from a 16:9 ratio and target height', () => {
		const output = run({
			...base,
			mode: 'scale',
			ratioW: 16,
			ratioH: 9,
			lock: 'height',
			target: 720
		});
		expect(output.error).toBeUndefined();
		expect(output.height).toBe(720);
		expect(output.width).toBeCloseTo(1280, 5);
	});

	it('errors when scaling with an invalid ratio', () => {
		const output = run({
			...base,
			mode: 'scale',
			ratioW: 0,
			ratioH: 9,
			lock: 'width',
			target: 100
		});
		expect(output.error).toBeDefined();
	});

	it('errors when scaling with a non-positive target', () => {
		const output = run({ ...base, mode: 'scale', ratioW: 16, ratioH: 9, lock: 'width', target: 0 });
		expect(output.error).toBeDefined();
	});
});
