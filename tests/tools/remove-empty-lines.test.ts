import { describe, expect, it } from 'vitest';
import { run, removeEmptyLines } from '../../src/lib/tools/remove-empty-lines';

describe('remove-empty-lines', () => {
	it('removes blank and whitespace-only lines', () => {
		const out = run({ text: 'alpha\n\n  \n\nbeta\n   \ngamma\n' });
		expect(out.result).toBe('alpha\nbeta\ngamma');
		expect(out.removed).toBe(5);
	});

	it('keeps lines with visible text', () => {
		expect(run({ text: 'hello\nworld' }).result).toBe('hello\nworld');
		expect(run({ text: 'hello\nworld' }).removed).toBe(0);
	});

	it('normalizes CRLF before processing', () => {
		const out = run({ text: 'a\r\n\r\nb' });
		expect(out.result).toBe('a\nb');
		expect(out.removed).toBe(1);
	});

	it('returns empty result for empty input', () => {
		expect(run({ text: '' }).result).toBe('');
		expect(run({ text: '' }).removed).toBe(0);
	});

	it('declares share and workflow metadata', () => {
		expect(removeEmptyLines.capabilities).toContain('share');
		expect(removeEmptyLines.workflow?.next).toContain('trim-lines');
		expect(removeEmptyLines.presets?.length).toBeGreaterThan(0);
	});
});
