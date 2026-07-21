import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/json-minifier';

describe('json-minifier', () => {
	it('minifies valid JSON', () => {
		const result = run({ json: '{\n  "a": 1,\n  "b": 2\n}' });
		expect(result.valid).toBe(true);
		expect(result.minified).toBe('{"a":1,"b":2}');
		expect(result.minifiedBytes).toBeLessThan(result.originalBytes);
	});

	it('reports invalid JSON', () => {
		const result = run({ json: '{bad' });
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
		expect(result.minifiedBytes).toBe(result.originalBytes);
	});
});
