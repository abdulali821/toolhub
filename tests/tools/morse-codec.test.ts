import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/morse-codec';

describe('morse-codec', () => {
	it('encodes text to morse', () => {
		expect(run({ text: 'SOS', mode: 'encode' }).result).toBe('... --- ...');
	});

	it('decodes morse to text', () => {
		expect(run({ text: '... --- ...', mode: 'decode' }).result).toBe('SOS');
	});

	it('returns error for unsupported characters', () => {
		expect(run({ text: '你好', mode: 'encode' }).error).toBeDefined();
	});
});
