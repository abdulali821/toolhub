import { describe, expect, it } from 'vitest';
import { run } from '../../src/lib/tools/reading-time-estimator';

describe('reading-time-estimator', () => {
	it('returns zero for empty text', () => {
		const output = run({ text: '', wpm: 200 });
		expect(output.words).toBe(0);
		expect(output.minutes).toBe(0);
		expect(output.formatted).toBe('0 min read');
	});

	it('estimates minutes for a 400-word article at 200 wpm', () => {
		const text = Array.from({ length: 400 }, () => 'word').join(' ');
		const output = run({ text, wpm: 200 });
		expect(output.words).toBe(400);
		expect(output.minutes).toBe(2);
		expect(output.formatted).toBe('2 min read');
		expect(output.seconds).toBe(120);
	});

	it('rounds up partial minutes', () => {
		const text = Array.from({ length: 201 }, () => 'word').join(' ');
		const output = run({ text, wpm: 200 });
		expect(output.minutes).toBe(2);
	});

	it('always reports at least 1 minute for non-empty text', () => {
		const output = run({ text: 'just a few words here', wpm: 400 });
		expect(output.minutes).toBeGreaterThanOrEqual(1);
	});

	it('counts characters including whitespace', () => {
		const output = run({ text: 'hello world', wpm: 200 });
		expect(output.characters).toBe(11);
	});

	it('adjusts minutes based on words per minute', () => {
		const text = Array.from({ length: 300 }, () => 'word').join(' ');
		const slow = run({ text, wpm: 100 });
		const fast = run({ text, wpm: 300 });
		expect(slow.minutes).toBeGreaterThan(fast.minutes);
	});
});
