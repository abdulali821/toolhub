import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/yaml-validator';

describe('yaml-validator', () => {
	it('accepts valid YAML', () => {
		const result = run({ yaml: 'hello: world' });
		expect(result.valid).toBe(true);
		expect(result.message).toBe('Valid YAML');
	});

	it('rejects invalid YAML', () => {
		const result = run({ yaml: 'hello: [unclosed' });
		expect(result.valid).toBe(false);
		expect(result.error).toBeTruthy();
	});
});
