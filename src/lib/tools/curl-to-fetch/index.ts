import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	curl: v.pipe(v.string(), v.minLength(1, 'Paste a curl command')),
	target: v.picklist(['fetch', 'axios'])
});

export type CurlToFetchInput = v.InferOutput<typeof inputSchema>;
export type CurlToFetchOutput = {
	code: string;
	method: string;
	url: string;
	warnings: string[];
};

export type ParsedCurl = {
	url: string;
	method: string;
	headers: [string, string][];
	body: string | null;
	auth: { user: string; pass: string } | null;
	formFields: [string, string][];
	warnings: string[];
};

/** Flags that are safe to silently ignore — they don't affect the generated request. */
const NO_OP_FLAGS = new Set([
	'-s',
	'--silent',
	'-S',
	'--show-error',
	'-v',
	'--verbose',
	'-i',
	'--include',
	'-k',
	'--insecure',
	'-L',
	'--location',
	'--compressed',
	'-#',
	'--progress-bar',
	'-f',
	'--fail',
	'-4',
	'--ipv4',
	'-6',
	'--ipv6',
	'-G',
	'--get'
]);

/** Tokenize a shell-style curl command, honoring quotes and `\`-escaped chars. */
export function tokenizeCurl(input: string): string[] {
	const cleaned = input.replace(/\\\r?\n/g, ' ').trim();
	const tokens: string[] = [];
	let i = 0;
	const n = cleaned.length;

	while (i < n) {
		while (i < n && /\s/.test(cleaned[i]!)) i++;
		if (i >= n) break;

		let token = '';
		let quote: '"' | "'" | null = null;
		while (i < n) {
			const ch = cleaned[i]!;
			if (quote) {
				if (ch === quote) {
					quote = null;
					i++;
					continue;
				}
				if (quote === '"' && ch === '\\' && i + 1 < n && '"\\$`'.includes(cleaned[i + 1]!)) {
					token += cleaned[i + 1];
					i += 2;
					continue;
				}
				token += ch;
				i++;
				continue;
			}
			if (ch === '"' || ch === "'") {
				quote = ch;
				i++;
				continue;
			}
			if (/\s/.test(ch)) break;
			if (ch === '\\' && i + 1 < n) {
				token += cleaned[i + 1];
				i += 2;
				continue;
			}
			token += ch;
			i++;
		}
		tokens.push(token);
	}

	return tokens;
}

/** Parse a curl command string into structured request parts. */
export function parseCurl(input: string): ParsedCurl {
	const tokens = tokenizeCurl(input);
	let idx = tokens[0]?.toLowerCase() === 'curl' ? 1 : 0;

	let url = '';
	let method = '';
	const headers: [string, string][] = [];
	const dataParts: string[] = [];
	const formFields: [string, string][] = [];
	const warnings: string[] = [];
	let auth: { user: string; pass: string } | null = null;

	for (; idx < tokens.length; idx++) {
		const token = tokens[idx];
		if (!token) continue;

		if (token === '-X' || token === '--request') {
			method = (tokens[++idx] ?? '').toUpperCase();
			continue;
		}
		if (token === '-H' || token === '--header') {
			const header = tokens[++idx] ?? '';
			const sep = header.indexOf(':');
			if (sep > -1) {
				headers.push([header.slice(0, sep).trim(), header.slice(sep + 1).trim()]);
			} else if (header) {
				warnings.push(`Could not parse header: "${header}"`);
			}
			continue;
		}
		if (
			token === '-d' ||
			token === '--data' ||
			token === '--data-raw' ||
			token === '--data-binary' ||
			token === '--data-ascii' ||
			token === '--data-urlencode'
		) {
			dataParts.push(tokens[++idx] ?? '');
			continue;
		}
		if (token === '-F' || token === '--form') {
			const field = tokens[++idx] ?? '';
			const sep = field.indexOf('=');
			if (sep > -1) formFields.push([field.slice(0, sep), field.slice(sep + 1)]);
			else warnings.push(`Could not parse form field: "${field}"`);
			continue;
		}
		if (token === '-u' || token === '--user') {
			const cred = tokens[++idx] ?? '';
			const sep = cred.indexOf(':');
			auth =
				sep > -1
					? { user: cred.slice(0, sep), pass: cred.slice(sep + 1) }
					: { user: cred, pass: '' };
			continue;
		}
		if (token === '--url') {
			url = tokens[++idx] ?? '';
			continue;
		}
		if (token === '-A' || token === '--user-agent') {
			headers.push(['User-Agent', tokens[++idx] ?? '']);
			continue;
		}
		if (token === '-e' || token === '--referer') {
			headers.push(['Referer', tokens[++idx] ?? '']);
			continue;
		}
		if (token === '-b' || token === '--cookie') {
			headers.push(['Cookie', tokens[++idx] ?? '']);
			continue;
		}
		if (NO_OP_FLAGS.has(token)) continue;
		if (token.startsWith('-')) {
			warnings.push(`Unsupported option ignored: ${token}`);
			continue;
		}
		if (!url) {
			url = token;
		} else {
			warnings.push(`Ignoring extra argument: "${token}"`);
		}
	}

	let body: string | null = null;
	if (dataParts.length) {
		body = dataParts.join('&');
		if (!method) method = 'POST';
	}
	if (formFields.length) {
		if (!method) method = 'POST';
		warnings.push('Form fields (-F) produce a basic FormData snippet — verify field names/files.');
	}
	if (!method) method = 'GET';

	return { url, method, headers, body, auth, formFields, warnings };
}

function base64Encode(value: string): string {
	if (typeof btoa === 'function') return btoa(value);
	return Buffer.from(value, 'utf-8').toString('base64');
}

function withAuthHeader(parsed: ParsedCurl): [string, string][] {
	const headers = [...parsed.headers];
	if (parsed.auth) {
		const hasAuthHeader = headers.some(([key]) => key.toLowerCase() === 'authorization');
		if (!hasAuthHeader) {
			const encoded = base64Encode(`${parsed.auth.user}:${parsed.auth.pass}`);
			headers.push(['Authorization', `Basic ${encoded}`]);
		}
	}
	return headers;
}

type BodyLiteral = { kind: 'json'; json: unknown } | { kind: 'string'; value: string };

function resolveBodyLiteral(body: string | null, headers: [string, string][]): BodyLiteral | null {
	if (body == null || body === '') return null;
	const contentType = headers.find(([key]) => key.toLowerCase() === 'content-type')?.[1] ?? '';
	const looksJson = contentType.includes('json') || /^\s*[[{]/.test(body);
	if (looksJson) {
		try {
			return { kind: 'json', json: JSON.parse(body) };
		} catch {
			// fall through to raw string
		}
	}
	return { kind: 'string', value: body };
}

function headersBlock(headers: [string, string][], indent = '  '): string {
	const entries = headers.map(
		([key, value]) => `${indent}  ${JSON.stringify(key)}: ${JSON.stringify(value)}`
	);
	return `${indent}headers: {\n${entries.join(',\n')}\n${indent}}`;
}

function formDataSnippet(formFields: [string, string][], varName = 'form'): string {
	const lines = [`const ${varName} = new FormData();`];
	for (const [key, value] of formFields) {
		lines.push(`${varName}.append(${JSON.stringify(key)}, ${JSON.stringify(value)});`);
	}
	return lines.join('\n');
}

export function buildFetchCode(parsed: ParsedCurl): string {
	const headers = withAuthHeader(parsed);

	if (parsed.formFields.length) {
		const optionLines: string[] = [`  method: ${JSON.stringify(parsed.method)}`];
		const nonContentTypeHeaders = headers.filter(([k]) => k.toLowerCase() !== 'content-type');
		if (nonContentTypeHeaders.length) optionLines.push(headersBlock(nonContentTypeHeaders));
		optionLines.push('  body: form');

		return [
			formDataSnippet(parsed.formFields),
			'',
			`fetch(${JSON.stringify(parsed.url)}, {`,
			optionLines.join(',\n'),
			'})',
			'  .then((res) => res.json())',
			'  .then((data) => console.log(data))',
			'  .catch((err) => console.error(err));'
		].join('\n');
	}

	const optionLines: string[] = [`  method: ${JSON.stringify(parsed.method)}`];
	if (headers.length) optionLines.push(headersBlock(headers));

	const literal = resolveBodyLiteral(parsed.body, headers);
	if (literal) {
		const code =
			literal.kind === 'json'
				? `JSON.stringify(${JSON.stringify(literal.json, null, 2)})`
				: JSON.stringify(literal.value);
		optionLines.push(`  body: ${code}`);
	}

	return [
		`fetch(${JSON.stringify(parsed.url)}, {`,
		optionLines.join(',\n'),
		'})',
		'  .then((res) => res.json())',
		'  .then((data) => console.log(data))',
		'  .catch((err) => console.error(err));'
	].join('\n');
}

export function buildAxiosCode(parsed: ParsedCurl): string {
	const headers = withAuthHeader(parsed);

	if (parsed.formFields.length) {
		const optionLines: string[] = [
			`  method: ${JSON.stringify(parsed.method.toLowerCase())}`,
			`  url: ${JSON.stringify(parsed.url)}`
		];
		const nonContentTypeHeaders = headers.filter(([k]) => k.toLowerCase() !== 'content-type');
		if (nonContentTypeHeaders.length) optionLines.push(headersBlock(nonContentTypeHeaders));
		optionLines.push('  data: form');

		return [
			formDataSnippet(parsed.formFields),
			'',
			'axios({',
			optionLines.join(',\n'),
			'})',
			'  .then((res) => console.log(res.data))',
			'  .catch((err) => console.error(err));'
		].join('\n');
	}

	const optionLines: string[] = [
		`  method: ${JSON.stringify(parsed.method.toLowerCase())}`,
		`  url: ${JSON.stringify(parsed.url)}`
	];
	if (headers.length) optionLines.push(headersBlock(headers));

	const literal = resolveBodyLiteral(parsed.body, headers);
	if (literal) {
		const code =
			literal.kind === 'json'
				? JSON.stringify(literal.json, null, 2)
				: JSON.stringify(literal.value);
		optionLines.push(`  data: ${code}`);
	}

	return [
		'axios({',
		optionLines.join(',\n'),
		'})',
		'  .then((res) => console.log(res.data))',
		'  .catch((err) => console.error(err));'
	].join('\n');
}

export function run(input: CurlToFetchInput): CurlToFetchOutput {
	const parsed = parseCurl(input.curl);
	if (!parsed.url) {
		return {
			code: '',
			method: parsed.method,
			url: '',
			warnings: [...parsed.warnings, 'No URL found in the curl command.']
		};
	}

	const code = input.target === 'axios' ? buildAxiosCode(parsed) : buildFetchCode(parsed);
	return { code, method: parsed.method, url: parsed.url, warnings: parsed.warnings };
}

const SAMPLE_GET = `curl 'https://api.example.com/users?active=true' \\
  -H 'Accept: application/json'`;

const SAMPLE_POST_JSON = `curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Ada","role":"Engineer"}'`;

const SAMPLE_BASIC_AUTH = `curl https://api.example.com/account \\
  -u admin:s3cret`;

export const curlToFetch: ToolDefinition<CurlToFetchInput, CurlToFetchOutput> = {
	id: 'curl-to-fetch',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['curl', 'fetch', 'axios', 'http', 'converter', 'api'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		// Intentionally excludes `curl` — request bodies/headers can be large or sensitive.
		params: ['target']
	},
	presets: [
		{
			id: 'get-with-headers',
			label: 'GET with headers',
			params: { curl: SAMPLE_GET, target: 'fetch' }
		},
		{
			id: 'post-json',
			label: 'POST JSON body',
			params: { curl: SAMPLE_POST_JSON, target: 'fetch' }
		},
		{ id: 'basic-auth', label: 'Basic auth', params: { curl: SAMPLE_BASIC_AUTH, target: 'fetch' } }
	],
	workflow: {
		next: ['jwt-decoder', 'json-formatter', 'url-parser']
	},
	metadata: {
		name: 'cURL to Fetch',
		title: 'cURL to Fetch — Convert curl commands to JavaScript',
		description:
			'Paste a curl command and get equivalent JavaScript fetch (or Axios) code, including method, headers, body, and basic auth. Runs entirely in your browser.',
		keywords: [
			'curl to fetch',
			'curl to javascript',
			'curl to axios',
			'convert curl command',
			'curl converter'
		],
		related: ['jwt-decoder', 'json-formatter', 'url-parser'],
		faq: [
			{
				question: 'What curl options are supported?',
				answer:
					'URL, -X/--request, -H/--header (repeatable), -d/--data/--data-raw/--data-binary, -u/--user (basic auth), and a rough -F/--form (multipart) conversion. Common no-op flags like -s, -L, and --compressed are ignored safely.'
			},
			{
				question: 'How is a JSON body detected?',
				answer:
					'If a Content-Type header contains "json", or the body starts with { or [, it is parsed as JSON and re-emitted as a pretty-printed object passed to JSON.stringify. Otherwise the body is emitted as a plain string.'
			},
			{
				question: 'Is my curl command sent anywhere?',
				answer: 'No. Parsing and code generation both run locally in your browser.'
			},
			{
				question: 'Why isn\u2019t my full curl command in the shareable link?',
				answer:
					'Curl bodies can be long or contain secrets (tokens, passwords), so only the fetch/axios toggle is stored in the URL. Use copy/paste to share the command itself.'
			}
		],
		howTo: [
			'Paste a curl command (e.g. copied from your browser\u2019s Network tab)',
			'Choose fetch or Axios as the target',
			'Copy the generated JavaScript code',
			'Review any warnings for options that could not be translated'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['target'] }
};
