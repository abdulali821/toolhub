import { describe, expect, it } from 'vitest';
import {
	run,
	queryStringToJson,
	jsonToQueryString,
	queryStringJson
} from '../../src/lib/tools/query-string-json';

describe('query-string-json', () => {
	describe('to-json', () => {
		it('parses a plain query string into JSON', () => {
			const out = run({ mode: 'to-json', text: 'a=1&b=2' });
			expect(out.error).toBeUndefined();
			expect(JSON.parse(out.result)).toEqual({ a: '1', b: '2' });
		});

		it('strips a leading question mark', () => {
			const out = run({ mode: 'to-json', text: '?a=1' });
			expect(JSON.parse(out.result)).toEqual({ a: '1' });
		});

		it('collects repeated keys into arrays', () => {
			const parsed = queryStringToJson('tag=x&tag=y&tag=z');
			expect(parsed).toEqual({ tag: ['x', 'y', 'z'] });
		});

		it('keeps single-occurrence keys as plain strings', () => {
			const parsed = queryStringToJson('a=1&tag=x&tag=y');
			expect(parsed).toEqual({ a: '1', tag: ['x', 'y'] });
		});

		it('returns an empty result for blank input', () => {
			const out = run({ mode: 'to-json', text: '' });
			expect(out.result).toBe('');
			expect(out.error).toBeUndefined();
		});
	});

	describe('to-query', () => {
		it('converts a flat JSON object into a query string', () => {
			const out = run({ mode: 'to-query', text: '{"a":"1","b":"2"}' });
			expect(out.error).toBeUndefined();
			expect(out.result).toBe('a=1&b=2');
		});

		it('serializes array values as repeated keys', () => {
			const qs = jsonToQueryString({ tag: ['x', 'y'] });
			expect(qs).toBe('tag=x&tag=y');
		});

		it('errors on invalid JSON', () => {
			const out = run({ mode: 'to-query', text: '{not valid json' });
			expect(out.result).toBe('');
			expect(out.error).toBeTruthy();
		});

		it('errors when JSON is not a flat object', () => {
			const out = run({ mode: 'to-query', text: '[1,2,3]' });
			expect(out.error).toBeTruthy();
		});
	});

	it('declares share params with a maxParamBytes budget', () => {
		expect(queryStringJson.share?.params).toEqual(['mode', 'text']);
		expect(queryStringJson.share?.maxParamBytes).toBe(4000);
	});
});
