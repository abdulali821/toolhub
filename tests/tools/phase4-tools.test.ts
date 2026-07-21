import { describe, expect, it } from 'vitest';
import { run as htmlRun } from '../../src/lib/tools/html-codec';
import { run as baseRun } from '../../src/lib/tools/number-base-converter';
import { run as diffRun } from '../../src/lib/tools/text-diff';
import { run as csvRun } from '../../src/lib/tools/csv-json-converter';
import { run as regexRun } from '../../src/lib/tools/regex-tester';
import { run as mdRun } from '../../src/lib/tools/markdown-preview';
import { run as imgRun } from '../../src/lib/tools/image-to-base64';
import { validateFile } from '../../src/lib/utils/file';
import { getTool, listTools } from '../../src/lib/tools';

describe('phase 4 tools', () => {
	it('registers the phase 4 catalog', () => {
		expect(listTools().length).toBeGreaterThanOrEqual(20);
		expect(getTool('image-to-base64')?.file?.maxBytes).toBe(2 * 1024 * 1024);
	});

	it('encodes html entities', () => {
		expect(htmlRun({ text: '<a & "b">', mode: 'encode' }).result).toBe(
			'&lt;a &amp; &quot;b&quot;&gt;'
		);
	});

	it('converts number bases', () => {
		const out = baseRun({ value: 'FF', fromBase: 16, toBase: 10 });
		expect(out.error).toBeUndefined();
		expect(out.result).toBe('255');
	});

	it('diffs text lines', () => {
		const out = diffRun({ left: 'a\nb\nc', right: 'a\nx\nc' });
		expect(out.summary).toContain('added');
		expect(out.lines.some((l) => l.type === 'remove' && l.text === 'b')).toBe(true);
		expect(out.lines.some((l) => l.type === 'add' && l.text === 'x')).toBe(true);
	});

	it('converts csv to json and back', () => {
		const json = csvRun({
			text: 'name,role\nAda,Engineer',
			mode: 'csv-to-json',
			delimiter: ','
		});
		expect(json.error).toBeUndefined();
		expect(json.result).toContain('"Ada"');
		const csv = csvRun({ text: json.result, mode: 'json-to-csv', delimiter: ',' });
		expect(csv.result).toContain('Ada');
	});

	it('tests regex matches', () => {
		const out = regexRun({ pattern: '\\d+', flags: 'g', text: 'a1 b22' });
		expect(out.count).toBe(2);
		expect(out.matches[0]?.match).toBe('1');
	});

	it('previews markdown subset', () => {
		const out = mdRun({ markdown: '# Title\n\n**bold** and `code`' });
		expect(out.html).toContain('<h1>');
		expect(out.html).toContain('<strong>');
		expect(out.html).toContain('<code>');
	});

	it('builds image data uri outputs', () => {
		const dataUrl = 'data:image/png;base64,abc123';
		const out = imgRun({ dataUrl, fileName: 'x.png' });
		expect(out.base64).toBe('abc123');
		expect(out.html).toContain('x.png');
	});

	it('validates file constraints', () => {
		const file = new File(['x'], 'photo.png', { type: 'image/png' });
		const ok = validateFile(file, {
			maxBytes: 1024,
			mimeAllowlist: ['image/png'],
			extensions: ['.png']
		});
		expect(ok.ok).toBe(true);

		const bad = validateFile(new File(['x'], 'notes.txt', { type: 'text/plain' }), {
			maxBytes: 1024,
			extensions: ['.png']
		});
		expect(bad.ok).toBe(false);
	});
});
