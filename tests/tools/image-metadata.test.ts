import { describe, expect, it } from 'vitest';
import { readImageMetadata } from '../../src/lib/utils/image-canvas';
import { imageMetadata, run } from '../../src/lib/tools/image-metadata';

/** Minimal PNG IHDR chunk with 64×32 dimensions. */
function minimalPngBytes(): number[] {
	const bytes = new Uint8Array(33);
	bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
	bytes[16] = 0;
	bytes[17] = 0;
	bytes[18] = 0;
	bytes[19] = 64;
	bytes[20] = 0;
	bytes[21] = 0;
	bytes[22] = 0;
	bytes[23] = 32;
	return [...bytes];
}

describe('image-metadata', () => {
	it('does not declare share capability', () => {
		expect(imageMetadata.capabilities).toContain('upload');
		expect(imageMetadata.capabilities).not.toContain('share');
	});

	it('parses PNG dimensions via run', () => {
		const bytes = minimalPngBytes();
		const out = run({ bytes, fileName: 'icon.png', mimeType: 'image/png' });
		expect(out.fields).toEqual(readImageMetadata(new Uint8Array(bytes), 'icon.png', 'image/png'));
		expect(out.fields.find((f) => f.key === 'Width')?.value).toBe('64');
		expect(out.fields.find((f) => f.key === 'Height')?.value).toBe('32');
		expect(out.fields.find((f) => f.key === 'Format')?.value).toBe('PNG');
	});
});
