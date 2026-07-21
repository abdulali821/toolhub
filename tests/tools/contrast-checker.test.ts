import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/contrast-checker';

describe('contrast-checker', () => {
	it('evaluates black on white as high contrast', () => {
		const out = run({ fg: '#000000', bg: '#ffffff' });
		expect(out.error).toBeUndefined();
		expect(out.ratio).toBeGreaterThan(20);
		expect(out.aaNormal).toBe(true);
		expect(out.aaaNormal).toBe(true);
		expect(out.fgHex).toBe('#000000');
		expect(out.bgHex).toBe('#ffffff');
	});

	it('returns error for invalid colors', () => {
		expect(run({ fg: 'not-a-color', bg: '#ffffff' }).error).toBeDefined();
	});
});
