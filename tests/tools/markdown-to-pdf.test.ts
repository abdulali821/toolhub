import { describe, expect, it } from 'vitest';
import { parseMarkdownBlocks, run, stripInlineMarkdown } from '../../src/lib/tools/markdown-to-pdf';

describe('markdown-to-pdf', () => {
	it('strips inline markdown markers', () => {
		expect(stripInlineMarkdown('Hello **world** and *italics*')).toBe('Hello world and italics');
		expect(stripInlineMarkdown('[HeyTools](https://heytools.app)')).toBe(
			'HeyTools (https://heytools.app)'
		);
	});

	it('parses headings, lists, quotes, and code fences', () => {
		const blocks = parseMarkdownBlocks(`# Title

- one
- two

> note

\`\`\`
code
\`\`\`
`);
		expect(blocks.map((b) => b.type)).toEqual([
			'h1',
			'blank',
			'li',
			'li',
			'blank',
			'quote',
			'blank',
			'code',
			'blank'
		]);
	});

	it('generates a multi-page capable PDF data URL', async () => {
		const out = await run({
			markdown: `# Doc\n\nParagraph with enough text to render.\n\n## Section\n\n- item a\n- item b\n`
		});
		expect(out.pageCount).toBeGreaterThanOrEqual(1);
		expect(out.bytes.byteLength).toBeGreaterThan(100);
		expect(out.dataUrl).toMatch(/^data:application\/pdf;base64,/);
	});
});
