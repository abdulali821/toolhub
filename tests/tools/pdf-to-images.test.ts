import { describe, expect, it } from 'vitest';
import { getPageNumbersFromSpec, resolvePageNumbers } from '../../src/lib/tools/pdf-to-images';

describe('pdf-to-images helpers', () => {
	it('returns all pages when spec is empty', () => {
		expect(getPageNumbersFromSpec('', 4)).toEqual([1, 2, 3, 4]);
	});

	it('maps page spec to 1-based numbers', () => {
		expect(getPageNumbersFromSpec('1,3', 5)).toEqual([1, 3]);
	});

	it('resolvePageNumbers wraps getPageNumbersFromSpec', () => {
		expect(resolvePageNumbers({ pdf: new Uint8Array(), pagesSpec: '2' }, 3)).toEqual({
			pageNumbers: [2]
		});
	});
});

describe.skip('pdf-to-images browser render', () => {
	it('requires a browser canvas', () => {});
});
