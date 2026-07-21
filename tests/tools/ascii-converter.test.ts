import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/ascii-converter';

describe('ascii-converter', () => {
	it('encodes text to decimal code points', () => {
		expect(run({ text: 'Hi', mode: 'encode' }).result).toBe('72 105');
	});

	it('decodes code points to text', () => {
		expect(run({ text: '72 105', mode: 'decode' }).result).toBe('Hi');
	});

	it('returns error for invalid codes', () => {
		expect(run({ text: 'bad', mode: 'decode' }).error).toBeDefined();
	});
});
