import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/utils/image-canvas', () => ({
	convertImageFormat: vi.fn(async () => 'data:image/jpeg;base64,converted'),
	WEBP_FILE_CONSTRAINTS: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/webp',
		mimeAllowlist: ['image/webp'],
		extensions: ['.webp']
	}
}));

import { convertImageFormat } from '../../src/lib/utils/image-canvas';
import { run, webpToJpg } from '../../src/lib/tools/webp-to-jpg';

describe('webp-to-jpg', () => {
	it('exports run and converts to jpeg with quality', async () => {
		const out = await run({ dataUrl: 'data:image/webp;base64,abc', quality: 0.9 });
		expect(out.dataUrl).toBe('data:image/jpeg;base64,converted');
		expect(convertImageFormat).toHaveBeenCalledWith('data:image/webp;base64,abc', 'jpeg', 0.9);
	});

	it('accepts webp files only', () => {
		expect(webpToJpg.file?.mimeAllowlist).toEqual(['image/webp']);
		expect(webpToJpg.workflow?.next).toEqual(['jpg-to-webp', 'webp-to-png', 'image-compressor']);
	});
});
