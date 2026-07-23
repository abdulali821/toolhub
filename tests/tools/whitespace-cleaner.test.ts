import { describe, expect, it } from 'vitest';
import { run, whitespaceCleaner } from '../../src/lib/tools/whitespace-cleaner';

describe('whitespace-cleaner', () => {
	it('collapses multiple spaces within each line', () => {
		expect(run({ text: 'hello   world   heytools', mode: 'collapse' }).result).toBe(
			'hello world heytools'
		);
	});

	it('normalizes CRLF and lone CR newlines', () => {
		expect(run({ text: 'line1\r\nline2\rline3', mode: 'normalize-newlines' }).result).toBe(
			'line1\nline2\nline3'
		);
	});

	it('strips all whitespace', () => {
		expect(run({ text: 'hello   world\nline', mode: 'strip-all' }).result).toBe('helloworldline');
	});

	it('converts tabs to four spaces', () => {
		expect(run({ text: 'a\tb', mode: 'tabs-to-spaces' }).result).toBe('a    b');
	});

	it('declares share and workflow metadata', () => {
		expect(whitespaceCleaner.capabilities).toContain('share');
		expect(whitespaceCleaner.workflow?.next).toContain('trim-lines');
		expect(whitespaceCleaner.presets?.length).toBeGreaterThan(0);
	});
});
