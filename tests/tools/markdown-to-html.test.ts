import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/markdown-to-html';

describe('markdown-to-html', () => {
	it('converts headings', () => {
		expect(run({ markdown: '# Title' }).html).toBe('<h1>Title</h1>');
	});

	it('converts lists', () => {
		expect(run({ markdown: '- one\n- two' }).html).toBe('<ul>\n<li>one</li>\n<li>two</li>\n</ul>');
	});

	it('converts inline formatting', () => {
		const html = run({ markdown: '**bold** and *italic* and `code`' }).html;
		expect(html).toContain('<strong>bold</strong>');
		expect(html).toContain('<em>italic</em>');
		expect(html).toContain('<code>code</code>');
	});

	it('converts links', () => {
		const html = run({ markdown: '[HeyTools](https://example.com)' }).html;
		expect(html).toContain('<a href="https://example.com"');
		expect(html).toContain('HeyTools</a>');
	});

	it('escapes HTML-sensitive characters', () => {
		const html = run({ markdown: '<script>alert(1)</script>' }).html;
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('handles code fences', () => {
		const html = run({ markdown: '```\nconst a = 1;\n```' }).html;
		expect(html).toContain('<pre><code>');
		expect(html).toContain('const a = 1;');
		expect(html).toContain('</code></pre>');
	});

	it('produces the same output as markdown-preview for the same input', async () => {
		const { run: previewRun } = await import('../../src/lib/tools/markdown-preview');
		const markdown = '# Hi\n\nSome **text** with a [link](https://example.com).';
		expect(run({ markdown }).html).toBe(previewRun({ markdown }).html);
	});
});
