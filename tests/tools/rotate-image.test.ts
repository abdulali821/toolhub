import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/image-canvas', () => ({
	rotateImage: vi.fn(async () => 'data:image/png;base64,rotated'),
	IMAGE_FILE_CONSTRAINTS: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/png,image/jpeg,image/gif,image/webp',
		mimeAllowlist: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
		extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp']
	}
}));

import { rotateImage as rotateImageHelper } from '$lib/utils/image-canvas';
import { rotateImage, run } from '../../src/lib/tools/rotate-image';

describe('rotate-image', () => {
	it('exports run and calls rotateImage helper', async () => {
		const input = { dataUrl: 'data:image/png;base64,abc', degrees: 90 as const };
		const out = await run(input);
		expect(out.dataUrl).toBe('data:image/png;base64,rotated');
		expect(rotateImageHelper).toHaveBeenCalledWith(input.dataUrl, 90);
	});

	it('declares upload capabilities without share', () => {
		expect(rotateImage.capabilities).toContain('upload');
		expect(rotateImage.capabilities).not.toContain('share');
		expect(rotateImage.workflow?.next).toEqual(['crop-image', 'flip-image', 'image-resizer']);
	});
});
