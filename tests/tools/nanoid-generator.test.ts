import { describe, expect, it } from 'vitest';
import { run, URL_SAFE_ALPHABET, ALPHABET_PRESETS } from '../../src/lib/tools/nanoid-generator';

describe('nanoid-generator', () => {
	it('generates an id of the requested size using the default alphabet', () => {
		const { ids, error } = run({ size: 21, alphabet: URL_SAFE_ALPHABET, count: 1 });
		expect(error).toBeUndefined();
		expect(ids).toHaveLength(1);
		expect(ids[0]).toHaveLength(21);
		expect(ids[0]).toMatch(/^[A-Za-z0-9_-]{21}$/);
	});

	it('generates the requested count of ids', () => {
		const { ids } = run({ size: 10, alphabet: URL_SAFE_ALPHABET, count: 10 });
		expect(ids).toHaveLength(10);
		for (const id of ids) expect(id).toHaveLength(10);
	});

	it('generates ids that are (very likely) unique', () => {
		const { ids } = run({ size: 21, alphabet: URL_SAFE_ALPHABET, count: 50 });
		expect(new Set(ids).size).toBe(50);
	});

	it('respects a custom alphabet', () => {
		const { ids } = run({ size: 16, alphabet: ALPHABET_PRESETS.numeric, count: 5 });
		for (const id of ids) expect(id).toMatch(/^[0-9]{16}$/);
	});

	it('dedupes repeated characters in a custom alphabet', () => {
		const { ids } = run({ size: 10, alphabet: 'aaaabbbb', count: 3 });
		for (const id of ids) expect(id).toMatch(/^[ab]{10}$/);
	});

	it('errors when the alphabet has fewer than 2 unique characters', () => {
		const { ids, error } = run({ size: 10, alphabet: 'aaaa', count: 1 });
		expect(error).toBeDefined();
		expect(ids).toHaveLength(0);
	});

	it('joins ids with newlines', () => {
		const { ids, joined } = run({ size: 8, alphabet: URL_SAFE_ALPHABET, count: 3 });
		expect(joined).toBe(ids.join('\n'));
	});
});
