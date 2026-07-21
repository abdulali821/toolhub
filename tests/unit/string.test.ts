import { describe, expect, it } from 'vitest';
import { isSlug, toSlug } from '../../src/lib/utils/string';

describe('toSlug', () => {
	it('normalizes phrases to kebab-case', () => {
		expect(toSlug('JSON Formatter')).toBe('json-formatter');
	});
});

describe('isSlug', () => {
	it('accepts kebab-case', () => {
		expect(isSlug('json-formatter')).toBe(true);
	});

	it('rejects uppercase and spaces', () => {
		expect(isSlug('JSON Formatter')).toBe(false);
	});
});
