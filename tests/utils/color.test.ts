import { describe, expect, it } from 'vitest';
import {
	contrastRatio,
	evaluateContrast,
	parseColorToRgb,
	rgbToHex,
	simulateColorBlindness
} from '../../src/lib/utils/color';

describe('color utils', () => {
	it('parseColorToRgb accepts hex and rgb', () => {
		expect(parseColorToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
		expect(parseColorToRgb('rgb(0, 128, 255)')).toEqual({ r: 0, g: 128, b: 255 });
	});

	it('rgbToHex normalizes channels', () => {
		expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
	});

	it('evaluateContrast reports WCAG flags for black on white', () => {
		const fg = parseColorToRgb('#000000');
		const bg = parseColorToRgb('#ffffff');
		const result = evaluateContrast(fg, bg);
		expect(result.ratio).toBeGreaterThan(20);
		expect(result.aaNormal).toBe(true);
		expect(result.aaaNormal).toBe(true);
		expect(result.ratioLabel).toMatch(/:1$/);
	});

	it('contrastRatio is symmetric', () => {
		const a = parseColorToRgb('#1e293b');
		const b = parseColorToRgb('#ffffff');
		expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5);
	});

	it('simulateColorBlindness changes RGB for deuteranopia', () => {
		const red = { r: 255, g: 0, b: 0 };
		const green = { r: 0, g: 255, b: 0 };
		const simRed = simulateColorBlindness(red, 'deuteranopia');
		const simGreen = simulateColorBlindness(green, 'deuteranopia');
		expect(simRed).not.toEqual(red);
		expect(simGreen).not.toEqual(green);
	});

	it('simulateColorBlindness returns copy for none', () => {
		const rgb = { r: 10, g: 20, b: 30 };
		expect(simulateColorBlindness(rgb, 'none')).toEqual(rgb);
	});
});
