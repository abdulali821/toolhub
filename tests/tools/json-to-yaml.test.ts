import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/json-to-yaml';

describe('json-to-yaml', () => {
	it('converts JSON to YAML', () => {
		const result = run({ json: '{"hello":"world","items":[1,2]}' });
		expect(result.valid).toBe(true);
		expect(result.yaml).toContain('hello: world');
		expect(result.yaml).toContain('items:');
	});

	it('reports invalid JSON', () => {
		const result = run({ json: '{bad' });
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
		expect(result.yaml).toBe('');
	});
});
