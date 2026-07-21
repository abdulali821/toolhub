import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/utils/image-canvas', () => ({
	convertImageFormat: vi.fn(async () => 'data:image/webp;base64,converted'),
	PNG_FILE_CONSTRAINTS: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/png',
		mimeAllowlist: ['image/png'],
		extensions: ['.png']
	}
}));

import { convertImageFormat } from '../../src/lib/utils/image-canvas';
import { pngToWebp, run } from '../../src/lib/tools/png-to-webp';

describe('png-to-webp', () => {
	it('exports run and converts to webp with quality', async () => {
		const out = await run({ dataUrl: 'data:image/png;base64,abc', quality: 0.85 });
		expect(out.dataUrl).toBe('data:image/webp;base64,converted');
		expect(convertImageFormat).toHaveBeenCalledWith('data:image/png;base64,abc', 'webp', 0.85);
	});

	it('accepts png files only', () => {
		expect(pngToWebp.file?.mimeAllowlist).toEqual(['image/png']);
		expect(pngToWebp.workflow?.next).toEqual(['webp-to-png', 'jpg-to-webp', 'image-compressor']);
	});
});
