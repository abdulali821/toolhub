import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/utils/image-canvas', () => ({
	convertImageFormat: vi.fn(async () => 'data:image/png;base64,converted'),
	WEBP_FILE_CONSTRAINTS: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/webp',
		mimeAllowlist: ['image/webp'],
		extensions: ['.webp']
	}
}));

import { convertImageFormat } from '../../src/lib/utils/image-canvas';
import { run, webpToPng } from '../../src/lib/tools/webp-to-png';

describe('webp-to-png', () => {
	it('exports run and converts to png', async () => {
		const out = await run({ dataUrl: 'data:image/webp;base64,abc' });
		expect(out.dataUrl).toBe('data:image/png;base64,converted');
		expect(convertImageFormat).toHaveBeenCalledWith('data:image/webp;base64,abc', 'png');
	});

	it('accepts webp files only', () => {
		expect(webpToPng.file?.mimeAllowlist).toEqual(['image/webp']);
		expect(webpToPng.workflow?.next).toEqual(['png-to-webp', 'webp-to-jpg', 'image-converter']);
	});
});
