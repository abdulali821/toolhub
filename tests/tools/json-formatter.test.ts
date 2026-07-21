import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/json-formatter';

describe('json-formatter', () => {
	it('formats valid JSON', () => {
		const result = run({ json: '{"a":1}', indent: 2 });
		expect(result.valid).toBe(true);
		expect(result.formatted).toBe('{\n  "a": 1\n}');
	});

	it('reports invalid JSON', () => {
		const result = run({ json: '{bad', indent: 2 });
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
	});
});
