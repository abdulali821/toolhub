import { describe, expect, it, vi } from 'vitest';
import {
	colorDistance,
	parseHexColor,
	removeBackgroundFromRgba,
	rgbToHex,
	softAlphaFactor
} from '../../src/lib/utils/background-remove';

vi.mock('$lib/utils/image-canvas', () => ({
	removeBackground: vi.fn(async () => 'data:image/png;base64,nobg'),
	IMAGE_FILE_CONSTRAINTS: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/png,image/jpeg,image/gif,image/webp',
		mimeAllowlist: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
		extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp']
	}
}));

vi.mock('$lib/background-removal/client', () => ({
	removeBackgroundWithAi: vi.fn(async () => 'data:image/png;base64,ai-nobg'),
	beginBackgroundRemovalGeneration: vi.fn(() => 1),
	cancelBackgroundRemovalJobs: vi.fn(),
	getActiveBackgroundRemovalGeneration: vi.fn(() => 1),
	prepareImageForAiRemoval: vi.fn()
}));

import { removeBackground } from '$lib/utils/image-canvas';
import { removeBackgroundWithAi } from '$lib/background-removal/client';
import { backgroundRemover, run } from '../../src/lib/tools/background-remover';

describe('background-remove utils', () => {
	it('parses hex colors', () => {
		expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
		expect(parseHexColor('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
		expect(rgbToHex(0, 128, 255)).toBe('#0080ff');
	});

	it('computes soft alpha factors', () => {
		expect(softAlphaFactor(10, 20, 10)).toBe(0);
		expect(softAlphaFactor(25, 20, 10)).toBe(0.5);
		expect(softAlphaFactor(40, 20, 10)).toBe(1);
	});

	it('removes matching pixels in color mode', () => {
		const data = new Uint8ClampedArray([255, 255, 255, 255, 255, 0, 0, 255]);
		const { affected } = removeBackgroundFromRgba(data, 2, 1, {
			mode: 'color',
			target: { r: 255, g: 255, b: 255 },
			tolerance: 0,
			feather: 0
		});
		expect(affected).toBe(1);
		expect(data[3]).toBe(0);
		expect(data[7]).toBe(255);
	});

	it('wand only floods connected matching pixels', () => {
		const data = new Uint8ClampedArray([
			255, 255, 255, 255, 255, 0, 0, 255, 255, 255, 255, 255
		]);
		removeBackgroundFromRgba(data, 3, 1, {
			mode: 'wand',
			target: { r: 255, g: 255, b: 255 },
			tolerance: 0,
			feather: 0,
			seedX: 0,
			seedY: 0
		});
		expect(data[3]).toBe(0);
		expect(data[7]).toBe(255);
		expect(data[11]).toBe(255);
	});

	it('colorDistance uses chebyshev metric', () => {
		expect(colorDistance(10, 20, 30, 12, 25, 30)).toBe(5);
	});
});

describe('background-remover tool', () => {
	it('exports classic run and calls removeBackground helper', async () => {
		const input = {
			dataUrl: 'data:image/png;base64,abc',
			mode: 'color' as const,
			color: '#ffffff',
			tolerance: 32,
			feather: 8
		};
		const out = await run(input);
		expect(out.dataUrl).toBe('data:image/png;base64,nobg');
		expect(removeBackground).toHaveBeenCalledWith(input.dataUrl, {
			mode: 'color',
			color: '#ffffff',
			tolerance: 32,
			feather: 8,
			seedX: undefined,
			seedY: undefined
		});
	});

	it('ai mode delegates to browser AI helper when window exists', async () => {
		vi.stubGlobal('window', {} as Window & typeof globalThis);
		try {
			const out = await run({
				dataUrl: 'data:image/png;base64,abc',
				mode: 'ai',
				color: '#ffffff',
				tolerance: 32,
				feather: 8
			});
			expect(out.dataUrl).toBe('data:image/png;base64,ai-nobg');
			expect(removeBackgroundWithAi).toHaveBeenCalled();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('declares upload capabilities without share', () => {
		expect(backgroundRemover.capabilities).toContain('upload');
		expect(backgroundRemover.capabilities).not.toContain('share');
		expect(backgroundRemover.metadata.name).toBe('Background Remover');
		expect(backgroundRemover.file?.maxBytes).toBe(5 * 1024 * 1024);
	});
});
