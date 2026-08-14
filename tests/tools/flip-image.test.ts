import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/utils/image-canvas', () => ({
	flipImage: vi.fn(async () => 'data:image/png;base64,flipped'),
	IMAGE_FILE_CONSTRAINTS: {
		maxBytes: 2 * 1024 * 1024,
		accept: 'image/png,image/jpeg,image/gif,image/webp',
		mimeAllowlist: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
		extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp']
	}
}));

import { flipImage as flipImageHelper } from '$lib/utils/image-canvas';
import { flipImage, run } from '../../src/lib/tools/flip-image';

describe('flip-image', () => {
	it('exports run and calls flipImage helper', async () => {
		const input = { dataUrl: 'data:image/png;base64,abc', axis: 'vertical' as const };
		const out = await run(input);
		expect(out.dataUrl).toBe('data:image/png;base64,flipped');
		expect(flipImageHelper).toHaveBeenCalledWith(input.dataUrl, 'vertical');
	});

	it('declares upload capabilities without share', () => {
		expect(flipImage.capabilities).toContain('upload');
		expect(flipImage.capabilities).not.toContain('share');
		expect(flipImage.workflow?.next).toEqual(['rotate-image', 'crop-image', 'image-compressor']);
	});
});
