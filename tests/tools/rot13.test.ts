import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/rot13';

describe('rot13', () => {
	it('rotates letters by 13', () => {
		expect(run({ text: 'Hello' }).result).toBe('Uryyb');
	});

	it('is self-inverse', () => {
		const encoded = run({ text: 'ToolHub' }).result;
		expect(run({ text: encoded }).result).toBe('ToolHub');
	});
});
