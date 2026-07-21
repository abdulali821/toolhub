import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/color-picker';

describe('color-picker', () => {
	it('returns hex, rgb, and hsl for a hex input', () => {
		const out = run({ hex: '#ff0000' });
		expect(out.hex).toBe('#ff0000');
		expect(out.rgb).toBe('rgb(255, 0, 0)');
		expect(out.hsl).toBe('hsl(0, 100%, 50%)');
	});

	it('accepts rgb input', () => {
		const out = run({ hex: 'rgb(0, 128, 255)' });
		expect(out.hex).toBe('#0080ff');
		expect(out.error).toBeUndefined();
	});
});
