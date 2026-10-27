import { describe, expect, it } from 'vitest';
import {
	assetFilename,
	buildFaviconHtml,
	buildWebManifest,
	packPngsAsIco,
	bytesToDataUrl,
	dataUrlToBytes,
	joinAssetPath,
	normalizeAssetPath,
	normalizeInitials,
	pngFilename,
	faviconGenerator,
	FAVICON_SIZES
} from '../../src/lib/tools/favicon-generator';

describe('favicon-generator', () => {
	it('exposes standard favicon sizes', () => {
		expect(FAVICON_SIZES).toEqual([16, 32, 48, 180, 192, 512]);
	});

	it('builds HTML link tags with asset path and theme color', () => {
		const html = buildFaviconHtml({
			assetPath: '/icons/',
			includeSvg: true,
			themeColor: '#2563eb',
			useDarkTheme: true,
			darkThemeColor: '#0a0a0a',
			includeManifest: true
		});
		expect(html).toContain('/icons/favicon.ico');
		expect(html).toContain('favicon.svg');
		expect(html).toContain('apple-touch-icon');
		expect(html).toContain('site.webmanifest');
		expect(html).toContain('theme-color');
		expect(html).toContain('prefers-color-scheme: dark');
	});

	it('builds a web manifest with optional maskable icons', () => {
		const json = buildWebManifest({
			appName: 'HeyTools',
			shortName: 'HT',
			description: 'Tools',
			startUrl: '/',
			display: 'standalone',
			themeColor: '#fff',
			backgroundColor: '#000',
			assetPath: '/',
			includeMaskable: true
		});
		const parsed = JSON.parse(json) as { icons: { purpose: string }[]; name: string };
		expect(parsed.name).toBe('HeyTools');
		expect(parsed.icons.some((i) => i.purpose === 'maskable')).toBe(true);
	});

	it('normalizes asset paths', () => {
		expect(normalizeAssetPath('')).toBe('/');
		expect(normalizeAssetPath('icons')).toBe('/icons/');
		expect(joinAssetPath('/static/', 'favicon.ico')).toBe('/static/favicon.ico');
		expect(joinAssetPath('/', 'favicon.ico')).toBe('/favicon.ico');
	});

	it('clamps initials to two characters', () => {
		expect(normalizeInitials('HeyTools')).toBe('He');
		expect(normalizeInitials(' H T ')).toBe('HT');
		expect(normalizeInitials('a')).toBe('a');
	});

	it('names apple / pwa assets distinctly', () => {
		expect(pngFilename(180)).toBe('apple-touch-icon.png');
		expect(pngFilename(192)).toBe('pwa-192x192.png');
		expect(assetFilename('maskable-512')).toBe('pwa-maskable-512x512.png');
		expect(assetFilename('favicon-32')).toBe('favicon-32x32.png');
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

	it('declares capabilities and modern metadata', () => {
		expect(faviconGenerator.capabilities).toContain('download');
		expect(faviconGenerator.share?.params).toContain('mode');
		expect(faviconGenerator.file?.accept).toContain('image/svg+xml');
		expect(faviconGenerator.version).toBe('2.0.0');
		expect(faviconGenerator.tags).toContain('maskable');
	});
});
