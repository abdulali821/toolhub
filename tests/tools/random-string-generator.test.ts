import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/random-string-generator';

describe('random-string-generator', () => {
	it('generates a string of the requested length', () => {
		const { result } = run({
			length: 24,
			lowercase: true,
			uppercase: true,
			digits: true,
			symbols: false
		});
		expect(result).toHaveLength(24);
	});

	it('returns empty when no character sets are enabled', () => {
		const { result } = run({
			length: 12,
			lowercase: false,
			uppercase: false,
			digits: false,
			symbols: false
		});
		expect(result).toBe('');
	});
});
