import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/image-canvas', () => ({
	cropImage: vi.fn(async () => 'data:image/png;base64,cropped'),
	IMAGE_FILE_CONSTRAINTS: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/png,image/jpeg,image/gif,image/webp',
		mimeAllowlist: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
		extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp']
	}
}));

import { cropImage as cropImageHelper } from '$lib/utils/image-canvas';
import { cropImage, run } from '../../src/lib/tools/crop-image';

describe('crop-image', () => {
	it('exports run and calls cropImage helper', async () => {
		const input = { dataUrl: 'data:image/png;base64,abc', x: 10, y: 20, width: 100, height: 80 };
		const out = await run(input);
		expect(out.dataUrl).toBe('data:image/png;base64,cropped');
		expect(cropImageHelper).toHaveBeenCalledWith(input.dataUrl, {
			x: 10,
			y: 20,
			width: 100,
			height: 80
		});
	});

	it('declares upload capabilities without share', () => {
		expect(cropImage.capabilities).toContain('upload');
		expect(cropImage.capabilities).not.toContain('share');
		expect(cropImage.workflow?.next).toEqual([
			'rotate-image',
			'image-compressor',
			'image-converter'
		]);
	});
});
