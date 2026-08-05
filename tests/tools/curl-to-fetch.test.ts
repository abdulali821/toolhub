import { describe, expect, it } from 'vitest';
import {
	run,
	parseCurl,
	tokenizeCurl,
	buildFetchCode,
	curlToFetch
} from '../../src/lib/tools/curl-to-fetch';

describe('curl-to-fetch', () => {
	it('tokenizes quoted arguments and line continuations', () => {
		const tokens = tokenizeCurl(`curl 'https://api.example.com' \\\n  -H 'Accept: json'`);
		expect(tokens).toEqual(['curl', 'https://api.example.com', '-H', 'Accept: json']);
	});

	it('parses a GET request with repeatable headers', () => {
		const parsed = parseCurl(
			`curl 'https://api.example.com/users?active=true' -H 'Accept: application/json' -H 'X-Api-Key: abc123'`
		);
		expect(parsed.method).toBe('GET');
		expect(parsed.url).toBe('https://api.example.com/users?active=true');
		expect(parsed.headers).toEqual([
			['Accept', 'application/json'],
			['X-Api-Key', 'abc123']
		]);
		expect(parsed.body).toBeNull();
	});

	it('generates fetch code for a GET request with headers', () => {
		const out = run({
			curl: `curl https://api.example.com/users -H 'Accept: application/json'`,
			target: 'fetch'
		});
		expect(out.method).toBe('GET');
		expect(out.url).toBe('https://api.example.com/users');
		expect(out.code).toContain(`fetch("https://api.example.com/users"`);
		expect(out.code).toContain('"Accept": "application/json"');
		expect(out.code).not.toContain('body:');
		expect(out.warnings).toEqual([]);
	});

	it('defaults to POST and JSON-stringifies a JSON body', () => {
		const out = run({
			curl: `curl https://api.example.com/users -H 'Content-Type: application/json' -d '{"name":"Ada","role":"Engineer"}'`,
			target: 'fetch'
		});
		expect(out.method).toBe('POST');
		expect(out.code).toContain('method: "POST"');
		expect(out.code).toContain('body: JSON.stringify(');
		expect(out.code).toContain('"name": "Ada"');
		expect(out.code).toContain('"role": "Engineer"');
	});

	it('generates axios code with an inline JSON data object (no stringify)', () => {
		const out = run({
			curl: `curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{"name":"Ada"}'`,
			target: 'axios'
		});
		expect(out.code).toContain('axios({');
		expect(out.code).toContain('method: "post"');
		expect(out.code).toContain('url: "https://api.example.com/users"');
		expect(out.code).toContain('data: {');
		expect(out.code).not.toContain('JSON.stringify');
	});

	it('adds a Basic auth header from -u user:pass', () => {
		const parsed = parseCurl(`curl https://api.example.com/account -u admin:s3cret`);
		expect(parsed.auth).toEqual({ user: 'admin', pass: 's3cret' });

		const code = buildFetchCode(parsed);
		const expectedAuth = Buffer.from('admin:s3cret', 'utf-8').toString('base64');
		expect(code).toContain(`"Authorization": "Basic ${expectedAuth}"`);
	});

	it('does not override an explicit Authorization header with -u', () => {
		const parsed = parseCurl(
			`curl https://api.example.com -u admin:s3cret -H 'Authorization: Bearer abc'`
		);
		const code = buildFetchCode(parsed);
		expect(code).toContain('"Authorization": "Bearer abc"');
		expect(code).not.toContain('Basic');
	});

	it('warns about unsupported options instead of throwing', () => {
		const parsed = parseCurl(`curl https://api.example.com --http2 --max-time 30`);
		expect(parsed.warnings.some((w) => w.includes('--http2'))).toBe(true);
	});

	it('reports a warning and empty code when no URL is present', () => {
		const out = run({ curl: 'curl -H "Accept: json"', target: 'fetch' });
		expect(out.code).toBe('');
		expect(out.warnings.some((w) => w.includes('No URL'))).toBe(true);
	});

	it('renders a rough FormData snippet for -F fields', () => {
		const out = run({
			curl: `curl https://api.example.com/upload -F 'file=report.csv' -F 'name=Q1'`,
			target: 'fetch'
		});
		expect(out.code).toContain('new FormData()');
		expect(out.code).toContain('form.append("file", "report.csv")');
		expect(out.code).toContain('body: form');
		expect(out.warnings.some((w) => w.toLowerCase().includes('form'))).toBe(true);
	});

	it('generates equivalent axios code for basic auth', () => {
		const out = run({ curl: `curl https://api.example.com -u admin:s3cret`, target: 'axios' });
		const expectedAuth = Buffer.from('admin:s3cret', 'utf-8').toString('base64');
		expect(out.code).toContain(`"Authorization": "Basic ${expectedAuth}"`);
		expect(out.code).toContain('axios({');
	});

	it('declares capabilities, presets, and a curl-free share config', () => {
		expect(curlToFetch.capabilities).toContain('copy');
		expect(curlToFetch.share?.params).toEqual(['target']);
		expect(curlToFetch.presets?.length).toBeGreaterThanOrEqual(3);
		expect(curlToFetch.metadata.faq?.length).toBeGreaterThanOrEqual(3);
	});
});
