import { describe, expect, it } from 'vitest';
import { pngToJpg } from '../../src/lib/tools/png-to-jpg';

describe('png-to-jpg', () => {
	it('accepts png files only', () => {
		expect(pngToJpg.file?.mimeAllowlist).toEqual(['image/png']);
		expect(pngToJpg.workflow?.next).toEqual(['jpg-to-png', 'png-to-webp', 'image-converter']);
	});
});
