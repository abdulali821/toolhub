import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/fake-data-generator';

describe('fake-data-generator', () => {
	it('generates fake users', () => {
		const out = run({ mode: 'users', count: 3, seed: 42 });
		expect(out.users).toHaveLength(3);
		expect(out.text).toContain('@');
		expect(out.users?.[0]?.country).toBeTruthy();
	});

	it('generates deterministic JSON with a seed', () => {
		const a = run({ mode: 'json', count: 2, seed: 99 });
		const b = run({ mode: 'json', count: 2, seed: 99 });
		expect(a.text).toBe(b.text);
		expect(JSON.parse(a.text)).toHaveLength(2);
	});
});
