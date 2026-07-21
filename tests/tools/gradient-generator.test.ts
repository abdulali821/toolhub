import { describe, expect, it } from 'vitest';
import { buildGradientCss, run } from '../../src/lib/tools/gradient-generator';

describe('gradient-generator', () => {
	it('builds a linear gradient', () => {
		expect(buildGradientCss({ type: 'linear', angle: 90, color1: '#000', color2: '#fff' })).toBe(
			'linear-gradient(90deg, #000, #fff)'
		);
	});

	it('builds a radial gradient', () => {
		const out = run({ type: 'radial', angle: 0, color1: '2563eb', color2: '9333ea' });
		expect(out.css).toBe('radial-gradient(circle, #2563eb, #9333ea)');
	});
});
