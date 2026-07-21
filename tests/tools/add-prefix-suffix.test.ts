import { describe, expect, it } from 'vitest';
import { run, addPrefixSuffix } from '../../src/lib/tools/add-prefix-suffix';

describe('add-prefix-suffix', () => {
	it('adds prefix and suffix to each line', () => {
		expect(run({ text: 'alpha\nbeta', prefix: '[', suffix: ']', skipEmpty: false }).result).toBe(
			'[alpha]\n[beta]'
		);
	});

	it('skips empty lines when skipEmpty is true', () => {
		expect(run({ text: 'alpha\n\nbeta', prefix: '- ', suffix: '', skipEmpty: true }).result).toBe(
			'- alpha\n\n- beta'
		);
	});

	it('applies prefix and suffix to empty lines when skipEmpty is false', () => {
		expect(run({ text: 'alpha\n\nbeta', prefix: '<', suffix: '>', skipEmpty: false }).result).toBe(
			'<alpha>\n<>\n<beta>'
		);
	});

	it('supports prefix-only or suffix-only', () => {
		expect(run({ text: 'a\nb', prefix: '* ', suffix: '', skipEmpty: false }).result).toBe(
			'* a\n* b'
		);
		expect(run({ text: 'a\nb', prefix: '', suffix: ';', skipEmpty: false }).result).toBe('a;\nb;');
	});

	it('declares share and workflow metadata', () => {
		expect(addPrefixSuffix.capabilities).toContain('share');
		expect(addPrefixSuffix.workflow?.next).toContain('find-replace');
		expect(addPrefixSuffix.presets?.length).toBeGreaterThan(0);
	});
});
