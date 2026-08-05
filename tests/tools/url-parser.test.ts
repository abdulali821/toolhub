import { describe, expect, it } from 'vitest';
import { run, urlParser } from '../../src/lib/tools/url-parser';

describe('url-parser', () => {
	it('parses protocol, host, path, hash, and query', () => {
		const out = run({ url: 'https://example.com/path?a=1&b=2#section' });
		expect(out.error).toBeUndefined();
		expect(out.protocol).toBe('https:');
		expect(out.hostname).toBe('example.com');
		expect(out.pathname).toBe('/path');
		expect(out.search).toBe('?a=1&b=2');
		expect(out.hash).toBe('#section');
		expect(out.query).toEqual([
			{ key: 'a', value: '1' },
			{ key: 'b', value: '2' }
		]);
	});

	it('extracts username, password, and port', () => {
		const out = run({ url: 'https://user:pass@example.com:8443/api' });
		expect(out.username).toBe('user');
		expect(out.password).toBe('pass');
		expect(out.port).toBe('8443');
	});

	it('returns blank username/password when absent', () => {
		const out = run({ url: 'https://example.com/' });
		expect(out.username).toBe('');
		expect(out.password).toBe('');
	});

	it('preserves repeated query keys as separate entries', () => {
		const out = run({ url: 'https://example.com/?tag=a&tag=b' });
		expect(out.query).toEqual([
			{ key: 'tag', value: 'a' },
			{ key: 'tag', value: 'b' }
		]);
	});

	it('returns an error for an invalid URL', () => {
		const out = run({ url: 'not a url' });
		expect(out.error).toBeTruthy();
		expect(out.hostname).toBe('');
		expect(out.query).toEqual([]);
	});

	it('declares share params', () => {
		expect(urlParser.share?.params).toEqual(['url']);
		expect(urlParser.capabilities).toContain('share');
	});
});
