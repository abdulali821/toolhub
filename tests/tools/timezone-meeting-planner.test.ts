import { describe, expect, it } from 'vitest';
import {
	run,
	timezoneLabel,
	timezoneMeetingPlanner,
	TIMEZONE_PRESETS,
	DEFAULT_TIMEZONES
} from '../../src/lib/tools/timezone-meeting-planner';

describe('timezone-meeting-planner', () => {
	it('formats a UTC anchor into each requested zone', () => {
		const out = run({
			datetime: '2025-06-16T12:00',
			zones: ['UTC', 'Asia/Karachi'],
			baseZone: 'UTC'
		});
		const utc = out.results.find((r) => r.zone === 'UTC');
		const karachi = out.results.find((r) => r.zone === 'Asia/Karachi');
		expect(utc?.localDate).toBe('2025-06-16');
		expect(utc?.localTime).toBe('12:00 PM');
		// Karachi is UTC+5, so noon UTC is 5 PM local.
		expect(karachi?.localTime).toBe('5:00 PM');
		expect(karachi?.offset).toBe('UTC+5');
	});

	it('flags an overnight/next-day hint when the local date shifts', () => {
		const out = run({
			datetime: '2025-06-16T22:00',
			zones: ['UTC', 'Asia/Tokyo'],
			baseZone: 'UTC'
		});
		const tokyo = out.results.find((r) => r.zone === 'Asia/Tokyo');
		// 22:00 UTC + 9h = 07:00 next day in Tokyo.
		expect(tokyo?.localDate).toBe('2025-06-17');
		expect(tokyo?.dayOffset).toBe(1);
		expect(tokyo?.isOvernight).toBe(true);

		const utc = out.results.find((r) => r.zone === 'UTC');
		expect(utc?.isOvernight).toBe(false);
	});

	it('sorts results west-to-east by UTC offset', () => {
		const out = run({
			datetime: '2025-06-16T12:00',
			zones: ['Asia/Tokyo', 'America/Los_Angeles', 'UTC', 'Europe/London'],
			baseZone: 'UTC'
		});
		const offsets = out.results.map((r) => r.offsetMinutes);
		expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
		expect(out.results[0]?.zone).toBe('America/Los_Angeles');
		expect(out.results.at(-1)?.zone).toBe('Asia/Tokyo');
	});

	it('respects a non-UTC base zone when resolving the anchor instant', () => {
		// 9 AM in Karachi (UTC+5) is 4 AM UTC the same day.
		const out = run({
			datetime: '2025-06-16T09:00',
			zones: ['UTC'],
			baseZone: 'Asia/Karachi'
		});
		expect(out.results[0]?.localTime).toBe('4:00 AM');
		expect(out.results[0]?.localDate).toBe('2025-06-16');
	});

	it('resolves friendly labels for curated zones and falls back to the id otherwise', () => {
		expect(timezoneLabel('Europe/London')).toBe('London');
		expect(timezoneLabel('Antarctica/Troll')).toBe('Antarctica/Troll');
	});

	it('exposes curated presets and defaults', () => {
		expect(TIMEZONE_PRESETS.length).toBeGreaterThanOrEqual(40);
		expect(TIMEZONE_PRESETS.some((p) => p.timeZone === 'UTC')).toBe(true);
		expect(TIMEZONE_PRESETS.some((p) => p.label === 'Toronto')).toBe(true);
		expect(TIMEZONE_PRESETS.some((p) => p.label === 'Auckland')).toBe(true);
		expect(DEFAULT_TIMEZONES.length).toBeGreaterThan(0);
	});

	it('declares share params and capabilities', () => {
		expect(timezoneMeetingPlanner.capabilities).toContain('share');
		expect(timezoneMeetingPlanner.share?.params).toEqual(['datetime', 'zones']);
		expect(timezoneMeetingPlanner.metadata.faq?.length).toBeGreaterThanOrEqual(3);
	});

	it('throws on an unparseable datetime', () => {
		expect(() => run({ datetime: 'not-a-date', zones: ['UTC'] })).toThrow();
	});

	it('rejects an empty zones list via schema', () => {
		expect(() => run({ datetime: '2025-06-16T12:00', zones: [] })).toThrow();
	});
});
