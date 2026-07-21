import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run, imageColorExtractor } from '../../src/lib/tools/image-color-extractor';

function mockCanvas(imageData: { data: Uint8ClampedArray }) {
	vi.stubGlobal('document', {
		createElement: (tag: string) => {
			if (tag !== 'canvas') throw new Error(`Unexpected tag: ${tag}`);
			return {
				width: 0,
				height: 0,
				getContext: () => ({
					drawImage: vi.fn(),
					getImageData: () => imageData
				}),
				toDataURL: vi.fn()
			};
		}
	});
}

describe('image-color-extractor', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'Image',
			class {
				naturalWidth = 4;
				naturalHeight = 4;
				onload: (() => void) | null = null;
				set src(_value: string) {
					this.onload?.();
				}
			}
		);

		mockCanvas({
			data: new Uint8ClampedArray([
				255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0, 255, 0,
				0, 255, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255,
				0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0
			])
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('declares upload and copy without share', () => {
		expect(imageColorExtractor.capabilities).toContain('upload');
		expect(imageColorExtractor.capabilities).toContain('copy');
		expect(imageColorExtractor.capabilities).not.toContain('share');
	});

	it('returns dominant colors from a data URL', async () => {
		const out = await run({ dataUrl: 'data:image/png;base64,abc', maxColors: 3 });
		expect(out.colors.length).toBeGreaterThan(0);
		expect(out.colors[0]?.hex).toMatch(/^#[0-9a-f]{6}$/i);
		expect(out.colors[0]?.percent).toBeGreaterThan(0);
	});
});
