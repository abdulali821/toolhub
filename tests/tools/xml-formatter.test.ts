import { describe, expect, it } from 'vitest';
import { formatXml, run } from '../../src/lib/tools/xml-formatter';

describe('xml-formatter', () => {
	it('pretty-prints nested XML', () => {
		const result = run({ xml: '<root><item>Hello</item></root>', indent: 2 });
		expect(result.valid).toBe(true);
		expect(result.formatted).toContain('<root>');
		expect(result.formatted).toContain('  <item>');
		expect(result.formatted).toContain('    Hello');
	});

	it('handles self-closing tags', () => {
		const result = run({ xml: '<root><item id="1"/></root>', indent: 2 });
		expect(result.valid).toBe(true);
		expect(result.formatted).toContain('<item id="1"/>');
	});

	it('reports unbalanced tags', () => {
		const result = formatXml('<root><item></root>', 2);
		expect(result.valid).toBe(false);
		expect(result.error).toMatch(/Unbalanced|Unclosed/);
	});

	it('preserves comments', () => {
		const result = run({ xml: '<root><!-- note --><item/></root>', indent: 2 });
		expect(result.valid).toBe(true);
		expect(result.formatted).toContain('<!-- note -->');
	});
});
