import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/cron-generator';

describe('cron-generator', () => {
	it('builds an every-minute expression', () => {
		const out = run({ minute: '*', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' });
		expect(out.expression).toBe('* * * * *');
		expect(out.explanation).toBe('Runs every minute.');
	});

	it('builds an hourly expression', () => {
		const out = run({ minute: '0', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' });
		expect(out.expression).toBe('0 * * * *');
		expect(out.explanation).toBe('Runs every hour, at minute 0.');
	});

	it('builds a daily-at-noon expression', () => {
		const out = run({ minute: '0', hour: '12', dayOfMonth: '*', month: '*', dayOfWeek: '*' });
		expect(out.expression).toBe('0 12 * * *');
		expect(out.explanation).toBe('Runs every day at 12:00 PM.');
	});

	it('builds a weekly Monday 9am expression', () => {
		const out = run({ minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '1' });
		expect(out.expression).toBe('0 9 * * 1');
		expect(out.explanation).toBe('Runs every week on Monday at 9:00 AM.');
	});

	it('builds a monthly 1st-at-midnight expression', () => {
		const out = run({ minute: '0', hour: '0', dayOfMonth: '1', month: '*', dayOfWeek: '*' });
		expect(out.expression).toBe('0 0 1 * *');
		expect(out.explanation).toBe('Runs every month on day 1 at 12:00 AM.');
	});

	it('rejects an out-of-range field', () => {
		const out = run({ minute: '99', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' });
		expect(out.error).toBeDefined();
		expect(out.expression).toBe('');
	});

	it('rejects invalid characters', () => {
		const out = run({ minute: 'abc', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' });
		expect(out.error).toBeDefined();
	});

	it('allows list and step syntax through validation', () => {
		const out = run({ minute: '*/15', hour: '0,12', dayOfMonth: '*', month: '*', dayOfWeek: '*' });
		expect(out.error).toBeUndefined();
		expect(out.expression).toBe('*/15 0,12 * * *');
	});
});
