import { describe, expect, it } from 'vitest';
import { parseColorList, run } from '../../src/lib/tools/color-blindness-simulator';

describe('color-blindness-simulator', () => {
	it('simulates a comma-separated palette', () => {
		const out = run({
			mode: 'colors',
			type: 'deuteranopia',
			colors: '#ff0000, #00ff00'
		});
		expect(out.error).toBeUndefined();
		expect(out.colors).toHaveLength(2);
		expect(out.colors[0]!.original).toBe('#ff0000');
		expect(out.colors[0]!.simulated).not.toBe('#ff0000');
	});

	it('parses newline-separated colors', () => {
		expect(parseColorList('#ff0000\n#00ff00')).toEqual(['#ff0000', '#00ff00']);
	});

	it('returns empty colors for image mode in run()', () => {
		expect(run({ mode: 'image', type: 'protanopia', colors: '' }).colors).toEqual([]);
	});

	it('returns error when palette is empty', () => {
		expect(run({ mode: 'colors', type: 'protanopia', colors: '  ' }).error).toBeDefined();
	});
});
