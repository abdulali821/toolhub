import { describe, expect, it } from 'vitest';
import { jpgToWebp } from '../../src/lib/tools/jpg-to-webp';

describe('jpg-to-webp', () => {
	it('accepts jpeg files only', () => {
		expect(jpgToWebp.file?.mimeAllowlist).toEqual(['image/jpeg']);
		expect(jpgToWebp.workflow?.next).toEqual(['webp-to-jpg', 'jpg-to-png', 'image-converter']);
	});
});
