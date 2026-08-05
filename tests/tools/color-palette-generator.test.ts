import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/color-palette-generator';

describe('color-palette-generator', () => {
	it('generates tints and shades around the base color', () => {
		const { baseHex, colors, error } = run({ baseHex: '#3b82f6', mode: 'tints-shades' });
		expect(error).toBeUndefined();
		expect(baseHex).toBe('#3b82f6');
		expect(colors).toHaveLength(9);
		expect(colors.find((c) => c.label === 'Base')?.hex).toBe('#3b82f6');
		expect(colors[0]!.hex).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('generates a complementary pair 180° apart', () => {
		const { colors, error } = run({ baseHex: '#ff0000', mode: 'complementary' });
		expect(error).toBeUndefined();
		expect(colors).toHaveLength(2);
		expect(colors[0]!.hex).toBe('#ff0000');
		expect(colors[1]!.hex.toLowerCase()).toBe('#00ffff');
	});

	it('generates 5 analogous colors', () => {
		const { colors, error } = run({ baseHex: '#3b82f6', mode: 'analogous' });
		expect(error).toBeUndefined();
		expect(colors).toHaveLength(5);
		expect(colors.map((c) => c.label)).toEqual(['-60°', '-30°', 'Base', '+30°', '+60°']);
	});

	it('generates 3 triadic colors', () => {
		const { colors, error } = run({ baseHex: '#3b82f6', mode: 'triadic' });
		expect(error).toBeUndefined();
		expect(colors).toHaveLength(3);
	});

	it('accepts hex without a leading #', () => {
		const { baseHex, error } = run({ baseHex: '3b82f6', mode: 'complementary' });
		expect(error).toBeUndefined();
		expect(baseHex).toBe('#3b82f6');
	});

	it('returns an error for invalid colors', () => {
		const { colors, error } = run({ baseHex: 'not-a-color', mode: 'tints-shades' });
		expect(error).toBeDefined();
		expect(colors).toHaveLength(0);
	});
});
