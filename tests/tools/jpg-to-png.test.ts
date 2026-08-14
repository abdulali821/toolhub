import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/image-canvas', () => ({
	convertImageFormat: vi.fn(async () => 'data:image/png;base64,converted'),
	JPEG_FILE_CONSTRAINTS: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/jpeg',
		mimeAllowlist: ['image/jpeg'],
		extensions: ['.jpg', '.jpeg']
	}
}));

import { convertImageFormat } from '$lib/utils/image-canvas';
import { jpgToPng, run } from '../../src/lib/tools/jpg-to-png';

describe('jpg-to-png', () => {
	it('exports run and converts to png', async () => {
		const out = await run({ dataUrl: 'data:image/jpeg;base64,abc' });
		expect(out.dataUrl).toBe('data:image/png;base64,converted');
		expect(convertImageFormat).toHaveBeenCalledWith('data:image/jpeg;base64,abc', 'png');
	});

	it('accepts jpeg files only', () => {
		expect(jpgToPng.file?.mimeAllowlist).toEqual(['image/jpeg']);
		expect(jpgToPng.workflow?.next).toEqual(['png-to-jpg', 'png-to-webp', 'image-converter']);
	});
});
