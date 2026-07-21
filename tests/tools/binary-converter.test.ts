import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/binary-converter';

describe('binary-converter', () => {
	it('encodes text to binary bytes', () => {
		expect(run({ text: 'Hi', mode: 'encode' }).result).toBe('01001000 01101001');
	});

	it('decodes binary to text', () => {
		expect(run({ text: '01001000 01101001', mode: 'decode' }).result).toBe('Hi');
	});

	it('returns error for invalid binary', () => {
		expect(run({ text: '12', mode: 'decode' }).error).toBeDefined();
	});
});
