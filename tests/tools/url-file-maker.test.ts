import { describe, expect, it } from 'vitest';
import { buildUrlFileContent, run, sanitizeUrlFileName } from '../../src/lib/tools/url-file-maker';

describe('url-file-maker', () => {
	it('builds a Windows Internet Shortcut body', () => {
		expect(buildUrlFileContent('https://example.com/')).toBe(
			'[InternetShortcut]\r\nURL=https://example.com/\r\n'
		);
	});

	it('adds https when the scheme is missing', () => {
		const out = run({ url: 'example.com/path', fileName: 'Demo' });
		expect(out.error).toBeUndefined();
		expect(out.content).toContain('URL=https://example.com/path');
		expect(out.fileName).toBe('Demo.url');
	});

	it('sanitizes illegal Windows file name characters', () => {
		expect(sanitizeUrlFileName('My:Site?/Name', 'fallback')).toBe('My-Site-Name.url');
	});

	it('falls back to hostname when file name is empty', () => {
		const out = run({ url: 'https://www.heytools.app/tools', fileName: '' });
		expect(out.fileName).toBe('heytools.app.url');
		expect(out.zipFileName).toBe('heytools.app.zip');
	});

	it('builds a zip that contains the .url entry', async () => {
		const { buildUrlShortcutZip } = await import('../../src/lib/tools/url-file-maker');
		const JSZip = (await import('jszip')).default;
		const out = run({ url: 'https://youtube.com', fileName: 'YouTube' });
		const blob = await buildUrlShortcutZip(out.fileName, out.content);
		const zip = await JSZip.loadAsync(await blob.arrayBuffer());
		const entry = zip.file('YouTube.url');
		expect(entry).toBeTruthy();
		expect(await entry!.async('string')).toContain('URL=https://youtube.com/');
	});

	it('rejects empty and invalid URLs', () => {
		expect(run({ url: '', fileName: '' }).error).toBeTruthy();
		expect(run({ url: 'not a url!!!', fileName: '' }).error).toBeTruthy();
	});
});
