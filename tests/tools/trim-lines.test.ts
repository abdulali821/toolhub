import { describe, expect, it } from 'vitest';
import { run, trimLines } from '../../src/lib/tools/trim-lines';

describe('trim-lines', () => {
	it('trims both sides by default', () => {
		expect(run({ text: '  alpha  \n\tbeta\t', side: 'both' }).result).toBe('alpha\nbeta');
	});

	it('trims start only', () => {
		expect(run({ text: '  alpha  ', side: 'start' }).result).toBe('alpha  ');
	});

	it('trims end only', () => {
		expect(run({ text: '  alpha  ', side: 'end' }).result).toBe('  alpha');
	});

	it('normalizes CRLF before trimming', () => {
		expect(run({ text: '  a  \r\n  b  ', side: 'both' }).result).toBe('a\nb');
	});

	it('declares share and workflow metadata', () => {
		expect(trimLines.capabilities).toContain('share');
		expect(trimLines.workflow?.next).toContain('remove-empty-lines');
		expect(trimLines.presets?.length).toBeGreaterThan(0);
	});
});
