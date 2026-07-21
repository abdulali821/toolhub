import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/yaml-to-json';

describe('yaml-to-json', () => {
	it('converts YAML to pretty JSON', () => {
		const result = run({ yaml: 'hello: world\nitems:\n  - 1\n  - 2' });
		expect(result.valid).toBe(true);
		expect(result.json).toContain('"hello": "world"');
		expect(result.json).toContain('"items"');
	});

	it('reports invalid YAML', () => {
		const result = run({ yaml: 'hello: [unclosed' });
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
		expect(result.json).toBe('');
	});
});
