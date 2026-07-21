import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/json-validator';

describe('json-validator', () => {
	it('validates correct JSON', () => {
		const result = run({ json: '{"a":1}' });
		expect(result.valid).toBe(true);
		expect(result.parsedPreview).toContain('"a"');
		expect(result.error).toBeUndefined();
	});

	it('reports invalid JSON with error', () => {
		const result = run({ json: '{ "a": 1, }' });
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
	});

	it('truncates long previews', () => {
		const big = JSON.stringify({ items: Array.from({ length: 200 }, (_, i) => i) });
		const result = run({ json: big });
		expect(result.valid).toBe(true);
		expect(result.parsedPreview!.length).toBeLessThanOrEqual(2003);
	});
});
