import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/unit-converter';

describe('unit-converter', () => {
	it('converts length units', () => {
		const out = run({ category: 'length', fromUnit: 'km', toUnit: 'mi', value: 5 });
		expect(out.result).toBeCloseTo(3.10686, 4);
	});

	it('converts weight units', () => {
		const out = run({ category: 'weight', fromUnit: 'kg', toUnit: 'lb', value: 1 });
		expect(out.result).toBeCloseTo(2.20462, 4);
	});

	it('converts temperature units (F to C)', () => {
		const out = run({ category: 'temperature', fromUnit: 'F', toUnit: 'C', value: 98.6 });
		expect(out.result).toBeCloseTo(37, 4);
	});

	it('converts temperature units (C to K)', () => {
		const out = run({ category: 'temperature', fromUnit: 'C', toUnit: 'K', value: 0 });
		expect(out.result).toBeCloseTo(273.15, 4);
	});

	it('converts data size using binary (1024) factors', () => {
		const out = run({ category: 'data-size', fromUnit: 'GB', toUnit: 'MB', value: 1 });
		expect(out.result).toBe(1024);
	});

	it('returns the same value for identical units', () => {
		const out = run({ category: 'length', fromUnit: 'm', toUnit: 'm', value: 42 });
		expect(out.result).toBe(42);
	});

	it('errors on an invalid number', () => {
		const out = run({ category: 'length', fromUnit: 'm', toUnit: 'km', value: Number.NaN });
		expect(out.error).toBeDefined();
		expect(out.result).toBeNull();
	});

	it('errors on an unknown unit for the category', () => {
		const out = run({ category: 'weight', fromUnit: 'kg', toUnit: 'gallon', value: 1 });
		expect(out.error).toBeDefined();
	});

	it('formats a human-readable result string', () => {
		const out = run({ category: 'length', fromUnit: 'km', toUnit: 'mi', value: 5 });
		expect(out.formatted).toContain('km');
		expect(out.formatted).toContain('mi');
		expect(out.formatted).toContain('=');
	});
});
