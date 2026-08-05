import { describe, expect, it } from 'vitest';
import {
	run,
	hexToRgb,
	boxShadowGenerator,
	inputSchema
} from '../../src/lib/tools/box-shadow-generator';
import * as v from 'valibot';

describe('box-shadow-generator', () => {
	it('builds a box-shadow value string with rgba color', () => {
		const out = run({
			offsetX: 2,
			offsetY: 4,
			blur: 10,
			spread: 0,
			color: '#000000',
			opacity: 0.35,
			inset: false
		});
		expect(out.value).toBe('2px 4px 10px 0px rgba(0, 0, 0, 0.35)');
		expect(out.css).toBe('box-shadow: 2px 4px 10px 0px rgba(0, 0, 0, 0.35);');
	});

	it('prefixes inset when inset is true', () => {
		const out = run({
			offsetX: 0,
			offsetY: 2,
			blur: 4,
			spread: 0,
			color: '000000',
			opacity: 0.25,
			inset: true
		});
		expect(out.value.startsWith('inset ')).toBe(true);
	});

	it('accepts hex colors without a leading #', () => {
		expect(hexToRgb('2563eb')).toEqual({ r: 37, g: 99, b: 235 });
		expect(hexToRgb('#2563eb')).toEqual({ r: 37, g: 99, b: 235 });
	});

	it('expands 3-digit hex shorthand', () => {
		expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
	});

	it('clamps rounding on opacity', () => {
		const out = run({
			offsetX: 0,
			offsetY: 0,
			blur: 0,
			spread: 0,
			color: '#fff',
			opacity: 0.123456,
			inset: false
		});
		expect(out.rgba).toBe('rgba(255, 255, 255, 0.123)');
	});

	it('rejects invalid hex colors via schema', () => {
		expect(() =>
			v.parse(inputSchema, {
				offsetX: 0,
				offsetY: 0,
				blur: 0,
				spread: 0,
				color: 'not-a-color',
				opacity: 0.5,
				inset: false
			})
		).toThrow();
	});

	it('declares share params and capabilities', () => {
		expect(boxShadowGenerator.capabilities).toContain('share');
		expect(boxShadowGenerator.share?.params).toEqual([
			'offsetX',
			'offsetY',
			'blur',
			'spread',
			'color',
			'opacity',
			'inset'
		]);
	});
});
