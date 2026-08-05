import { describe, expect, it } from 'vitest';
import {
	buildFaviconHtml,
	packPngsAsIco,
	bytesToDataUrl,
	dataUrlToBytes,
	normalizeInitials,
	pngFilename,
	faviconGenerator,
	FAVICON_SIZES
} from '../../src/lib/tools/favicon-generator';

describe('favicon-generator', () => {
	it('exposes standard favicon sizes', () => {
		expect(FAVICON_SIZES).toEqual([16, 32, 48, 180, 192, 512]);
	});

	it('builds HTML link tags', () => {
		const html = buildFaviconHtml();
		expect(html).toContain('favicon.ico');
		expect(html).toContain('apple-touch-icon');
		expect(html).toContain('32x32');
	});

	it('clamps initials to two characters', () => {
		expect(normalizeInitials('HeyTools')).toBe('He');
		expect(normalizeInitials(' H T ')).toBe('HT');
		expect(normalizeInitials('a')).toBe('a');
	});

	it('names apple touch separately from other PNGs', () => {
		expect(pngFilename(180)).toBe('apple-touch-icon.png');
		expect(pngFilename(32)).toBe('favicon-32x32.png');
	});

	it('packs PNG bytes into a valid ICO header', () => {
		const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3]);
		const ico = packPngsAsIco([
			{ size: 16, bytes: png },
			{ size: 32, bytes: png }
		]);
		const view = new DataView(ico.buffer);
		expect(view.getUint16(0, true)).toBe(0);
		expect(view.getUint16(2, true)).toBe(1);
		expect(view.getUint16(4, true)).toBe(2);
		expect(ico[6]).toBe(16);
		expect(ico[6 + 16]).toBe(32);
		expect(view.getUint32(6 + 8, true)).toBe(png.length);
	});

	it('round-trips data URL bytes', () => {
		const source = new Uint8Array([1, 2, 3, 4, 250]);
		const url = bytesToDataUrl(source, 'application/octet-stream');
		expect(dataUrlToBytes(url)).toEqual(source);
	});

	it('declares capabilities and share params', () => {
		expect(faviconGenerator.capabilities).toContain('download');
		expect(faviconGenerator.share?.params).toContain('mode');
		expect(faviconGenerator.file?.accept).toContain('image/png');
	});
});
