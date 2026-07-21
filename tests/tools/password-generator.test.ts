import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/password-generator';

describe('password-generator', () => {
	it('generates a password of the requested length', () => {
		const { password } = run({
			length: 20,
			uppercase: true,
			lowercase: true,
			numbers: true,
			symbols: false
		});
		expect(password).toHaveLength(20);
	});

	it('returns empty when no character sets are enabled', () => {
		const { password } = run({
			length: 12,
			uppercase: false,
			lowercase: false,
			numbers: false,
			symbols: false
		});
		expect(password).toBe('');
	});
});
