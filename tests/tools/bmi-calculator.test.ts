import { describe, expect, it } from 'vitest';
import { run, categorize, bmiCalculator } from '../../src/lib/tools/bmi-calculator';

describe('bmi-calculator', () => {
	it('calculates metric BMI', () => {
		const out = run({ unit: 'metric', weight: 70, height: 175 });
		expect(out.error).toBeUndefined();
		expect(out.bmi).toBeCloseTo(22.9, 1);
		expect(out.category).toBe('normal');
	});

	it('calculates imperial BMI', () => {
		const out = run({ unit: 'imperial', weight: 154, height: 69 });
		expect(out.error).toBeUndefined();
		expect(out.bmi).toBeCloseTo(22.7, 1);
		expect(out.category).toBe('normal');
	});

	it('categorizes underweight, overweight, and obese', () => {
		expect(categorize(17)).toBe('underweight');
		expect(categorize(27)).toBe('overweight');
		expect(categorize(32)).toBe('obese');
	});

	it('categorizes boundary values correctly', () => {
		expect(categorize(18.5)).toBe('normal');
		expect(categorize(24.9)).toBe('normal');
		expect(categorize(25)).toBe('overweight');
		expect(categorize(29.9)).toBe('overweight');
		expect(categorize(30)).toBe('obese');
	});

	it('rejects zero or negative weight', () => {
		expect(run({ unit: 'metric', weight: 0, height: 175 }).error).toBeTruthy();
		expect(run({ unit: 'metric', weight: -5, height: 175 }).error).toBeTruthy();
	});

	it('rejects zero or negative height', () => {
		expect(run({ unit: 'metric', weight: 70, height: 0 }).error).toBeTruthy();
	});

	it('includes a not-medical-advice FAQ entry', () => {
		const faq = bmiCalculator.metadata.faq ?? [];
		expect(faq.length).toBeGreaterThanOrEqual(2);
		expect(faq.some((item) => /medical advice/i.test(item.question + item.answer))).toBe(true);
	});

	it('declares share params for unit, weight, and height', () => {
		expect(bmiCalculator.share?.params).toEqual(['unit', 'weight', 'height']);
	});
});
