import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/hex-codec';

describe('hex-codec', () => {
	it('encodes text to hex bytes', () => {
		expect(run({ text: 'Hi', mode: 'encode' }).result).toBe('48 69');
	});

	it('decodes hex to text', () => {
		expect(run({ text: '48 69', mode: 'decode' }).result).toBe('Hi');
	});

	it('returns error for invalid hex', () => {
		expect(run({ text: 'xyz', mode: 'decode' }).error).toBeDefined();
	});
});
