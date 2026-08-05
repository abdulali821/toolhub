import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/date-calculator';

describe('date-calculator', () => {
	it('computes the difference between two dates', () => {
		const out = run({ mode: 'difference', startDate: '2024-01-01', endDate: '2024-12-31' });
		expect(out.error).toBeUndefined();
		expect(out.totalDays).toBe(365);
		expect(out.years).toBe(0);
		expect(out.months).toBe(11);
		expect(out.days).toBe(30);
	});

	it('is order-independent for difference (end before start)', () => {
		const out = run({ mode: 'difference', startDate: '2024-12-31', endDate: '2024-01-01' });
		expect(out.totalDays).toBe(365);
	});

	it('computes exact-year differences cleanly', () => {
		const out = run({ mode: 'difference', startDate: '2020-01-01', endDate: '2024-01-01' });
		expect(out.years).toBe(4);
		expect(out.months).toBe(0);
		expect(out.days).toBe(0);
	});

	it('computes age as zero for a birth date of today', () => {
		const today = new Date().toISOString().slice(0, 10);
		const out = run({ mode: 'age', birthDate: today });
		expect(out.error).toBeUndefined();
		expect(out.years).toBe(0);
		expect(out.months).toBe(0);
		expect(out.days).toBe(0);
	});

	it('errors when the birth date is in the future', () => {
		const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
		const out = run({ mode: 'age', birthDate: future });
		expect(out.error).toBeDefined();
	});

	it('adds days to a date', () => {
		const out = run({ mode: 'add', startDate: '2024-01-01', amount: 30, unit: 'days' });
		expect(out.error).toBeUndefined();
		expect(out.resultDate).toBe('2024-01-31');
	});

	it('adds months and clamps to the shorter target month', () => {
		const out = run({ mode: 'add', startDate: '2024-01-31', amount: 1, unit: 'months' });
		expect(out.resultDate).toBe('2024-02-29');
	});

	it('adds years to a date', () => {
		const out = run({ mode: 'add', startDate: '2024-02-29', amount: 1, unit: 'years' });
		expect(out.resultDate).toBe('2025-02-28');
	});

	it('errors on an invalid date string', () => {
		const out = run({ mode: 'difference', startDate: 'not-a-date', endDate: '2024-01-01' });
		expect(out.error).toBeDefined();
	});

	it('errors when the add mode is missing a unit', () => {
		const out = run({ mode: 'add', startDate: '2024-01-01', amount: 5 });
		expect(out.error).toBeDefined();
	});
});
