import { describe, expect, it } from 'vitest';
import { run, tipCalculator } from '../../src/lib/tools/tip-calculator';

describe('tip-calculator', () => {
	it('calculates tip, total, and per-person amounts', () => {
		const out = run({ bill: 100, tipPercent: 20, people: 4 });
		expect(out.error).toBeUndefined();
		expect(out.tipAmount).toBe(20);
		expect(out.total).toBe(120);
		expect(out.perPerson).toBe(30);
		expect(out.tipPerPerson).toBe(5);
	});

	it('defaults tip percent to 15 and people to 1 conceptually when unset by caller', () => {
		const out = run({ bill: 50, tipPercent: 15, people: 1 });
		expect(out.tipAmount).toBe(7.5);
		expect(out.total).toBe(57.5);
		expect(out.perPerson).toBe(57.5);
	});

	it('rounds to two decimal places', () => {
		const out = run({ bill: 33.33, tipPercent: 18, people: 3 });
		expect(out.tipAmount).toBe(6);
		expect(out.total).toBe(39.33);
		expect(out.perPerson).toBe(13.11);
	});

	it('rejects a negative bill', () => {
		const out = run({ bill: -10, tipPercent: 15, people: 1 });
		expect(out.error).toBeTruthy();
	});

	it('rejects zero or fractional people', () => {
		expect(run({ bill: 10, tipPercent: 10, people: 0 }).error).toBeTruthy();
		expect(run({ bill: 10, tipPercent: 10, people: 1.5 }).error).toBeTruthy();
	});

	it('allows a zero tip percent', () => {
		const out = run({ bill: 20, tipPercent: 0, people: 2 });
		expect(out.tipAmount).toBe(0);
		expect(out.total).toBe(20);
		expect(out.perPerson).toBe(10);
	});

	it('declares share params for bill, tipPercent, and people', () => {
		expect(tipCalculator.share?.params).toEqual(['bill', 'tipPercent', 'people']);
	});
});
