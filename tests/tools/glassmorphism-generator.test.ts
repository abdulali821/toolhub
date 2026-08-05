import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	run,
	hexToRgb,
	hexToRgba,
	inputSchema,
	glassmorphismGenerator
} from '../../src/lib/tools/glassmorphism-generator';

describe('glassmorphism-generator', () => {
	it('builds glass CSS with backdrop-filter and its webkit fallback', () => {
		const out = run({
			blur: 12,
			saturation: 160,
			bgColor: 'ffffff',
			bgOpacity: 0.2,
			borderOpacity: 0.3,
			borderWidth: 1,
			borderRadius: 20,
			shadow: true
		});
		expect(out.css).toContain('.glass {');
		expect(out.css).toContain('backdrop-filter: blur(12px) saturate(160%);');
		expect(out.css).toContain('-webkit-backdrop-filter: blur(12px) saturate(160%);');
		expect(out.css).toContain('background: rgba(255, 255, 255, 0.2);');
		expect(out.css).toContain('border: 1px solid rgba(255, 255, 255, 0.3);');
		expect(out.css).toContain('border-radius: 20px;');
		expect(out.css).toContain('box-shadow:');
	});

	it('omits box-shadow when shadow is disabled', () => {
		const out = run({
			blur: 8,
			saturation: 140,
			bgColor: '000000',
			bgOpacity: 0.35,
			borderOpacity: 0.15,
			borderWidth: 1,
			borderRadius: 16,
			shadow: false
		});
		expect(out.css).not.toContain('box-shadow');
	});

	it('mirrors the CSS declarations in panelStyle for inline use', () => {
		const out = run({
			blur: 10,
			saturation: 150,
			bgColor: '2563eb',
			bgOpacity: 0.25,
			borderOpacity: 0.2,
			borderWidth: 2,
			borderRadius: 12,
			shadow: false
		});
		expect(out.panelStyle).toContain('backdrop-filter: blur(10px) saturate(150%);');
		expect(out.panelStyle).toContain('border-radius: 12px;');
		expect(out.panelStyle).not.toContain('\n');
	});

	it('provides a background hint string', () => {
		const out = run({
			blur: 8,
			saturation: 140,
			bgColor: 'ffffff',
			bgOpacity: 0.2,
			borderOpacity: 0.3,
			borderWidth: 1,
			borderRadius: 16,
			shadow: true
		});
		expect(out.backgroundHint.length).toBeGreaterThan(0);
	});

	it('converts hex colors to rgb', () => {
		expect(hexToRgb('2563eb')).toEqual({ r: 37, g: 99, b: 235 });
		expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
	});

	it('converts hex + opacity into rgba, clamped and rounded', () => {
		expect(hexToRgba('#000000', 0.123456)).toBe('rgba(0, 0, 0, 0.123)');
		expect(hexToRgba('ffffff', 2)).toBe('rgba(255, 255, 255, 1)');
		expect(hexToRgba('ffffff', -1)).toBe('rgba(255, 255, 255, 0)');
	});

	it('rejects invalid hex colors via schema', () => {
		expect(() =>
			v.parse(inputSchema, {
				blur: 10,
				saturation: 150,
				bgColor: 'not-a-color',
				bgOpacity: 0.2,
				borderOpacity: 0.2,
				borderWidth: 1,
				borderRadius: 12,
				shadow: false
			})
		).toThrow();
	});

	it('declares share params, presets, and capabilities', () => {
		expect(glassmorphismGenerator.capabilities).toContain('share');
		expect(glassmorphismGenerator.share?.params).toEqual([
			'blur',
			'saturation',
			'bgColor',
			'bgOpacity',
			'borderOpacity',
			'borderWidth',
			'borderRadius',
			'shadow'
		]);
		expect(glassmorphismGenerator.presets?.map((p) => p.id)).toEqual([
			'soft',
			'frosted',
			'dark-glass'
		]);
		expect(glassmorphismGenerator.metadata.faq?.length).toBeGreaterThanOrEqual(3);
	});
});
