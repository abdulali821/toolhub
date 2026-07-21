import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/unicode-escape';

describe('unicode-escape', () => {
	it('escapes non-ascii characters', () => {
		const out = run({ text: 'café', mode: 'escape' });
		expect(out.result).toContain('\\u');
		expect(out.error).toBeUndefined();
	});

	it('unescapes unicode sequences', () => {
		expect(run({ text: 'caf\\u00e9', mode: 'unescape' }).result).toBe('café');
	});
});
