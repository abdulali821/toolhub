import { describe, expect, it } from 'vitest';
import { markdownToHtml } from '../../src/lib/utils/markdown';

describe('markdown utils', () => {
	it('converts mermaid fences to mermaid markup', () => {
		const html = markdownToHtml('```mermaid\nflowchart LR\n  A --> B\n```');
		expect(html).toContain('<pre class="mermaid">');
		expect(html).toContain('flowchart LR');
		expect(html).not.toContain('<pre><code>');
	});

	it('keeps regular code fences as pre/code', () => {
		const html = markdownToHtml('```js\nconst a = 1;\n```');
		expect(html).toContain('<pre><code>');
		expect(html).toContain('const a = 1;');
		expect(html).not.toContain('class="mermaid"');
	});
});
