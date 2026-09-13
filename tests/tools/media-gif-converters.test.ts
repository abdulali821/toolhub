import { describe, expect, it } from 'vitest';
import { mp4ToGif } from '../../src/lib/tools/mp4-to-gif';
import { gifToMp4 } from '../../src/lib/tools/gif-to-mp4';
import { svgToGif } from '../../src/lib/tools/svg-to-gif';
import { GIF_FILE_CONSTRAINTS, MP4_FILE_CONSTRAINTS } from '../../src/lib/utils/media-convert';

describe('mp4-to-gif', () => {
	it('accepts mp4 uploads and links sibling converters', () => {
		expect(mp4ToGif.id).toBe('mp4-to-gif');
		expect(mp4ToGif.file).toEqual(MP4_FILE_CONSTRAINTS);
		expect(mp4ToGif.workflow?.next).toContain('gif-to-mp4');
		expect(mp4ToGif.tags).toContain('gif');
	});
});

describe('gif-to-mp4', () => {
	it('accepts gif uploads and links sibling converters', () => {
		expect(gifToMp4.id).toBe('gif-to-mp4');
		expect(gifToMp4.file).toEqual(GIF_FILE_CONSTRAINTS);
		expect(gifToMp4.workflow?.next).toContain('mp4-to-gif');
	});
});

describe('svg-to-gif', () => {
	it('accepts svg uploads', () => {
		expect(svgToGif.id).toBe('svg-to-gif');
		expect(svgToGif.file?.extensions).toContain('.svg');
		expect(svgToGif.workflow?.next).toContain('mp4-to-gif');
	});
});
