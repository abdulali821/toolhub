import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run, imageConverter } from '../../src/lib/tools/image-converter';

describe('image-converter', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'Image',
			class {
				naturalWidth = 100;
				naturalHeight = 50;
				onload: (() => void) | null = null;
				set src(_value: string) {
					this.onload?.();
				}
			}
		);

		vi.stubGlobal('document', {
			createElement: (tag: string) => {
				if (tag !== 'canvas') throw new Error(`Unexpected tag: ${tag}`);
				return {
					width: 0,
					height: 0,
					getContext: () => ({
						fillRect: vi.fn(),
						drawImage: vi.fn()
					}),
					toDataURL: () => 'data:image/png;base64,converted'
				};
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('declares upload and download without share', () => {
		expect(imageConverter.capabilities).toContain('upload');
		expect(imageConverter.capabilities).toContain('download');
		expect(imageConverter.capabilities).not.toContain('share');
		expect(imageConverter.workflow?.next).toEqual([
			'image-compressor',
			'image-resizer',
			'crop-image'
		]);
	});

	it('converts image format via canvas', async () => {
		const out = await run({
			dataUrl: 'data:image/png;base64,abc',
			format: 'webp',
			quality: 0.8
		});
		expect(out.dataUrl).toBe('data:image/png;base64,converted');
	});
});
