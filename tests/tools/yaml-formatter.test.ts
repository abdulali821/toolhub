import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/yaml-formatter';

describe('yaml-formatter', () => {
	it('formats valid YAML', () => {
		const result = run({ yaml: 'hello: world\nitems: [one,two]', indent: 2 });
		expect(result.valid).toBe(true);
		expect(result.formatted).toContain('hello: world');
		expect(result.formatted).toContain('- one');
	});

	it('reports invalid YAML', () => {
		const result = run({ yaml: 'hello: [unclosed', indent: 2 });
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
	});

	it('supports compact output', () => {
		const result = run({ yaml: 'a: 1\nb: 2', indent: 0 });
		expect(result.valid).toBe(true);
		expect(result.formatted).not.toContain('\n  ');
	});
});
