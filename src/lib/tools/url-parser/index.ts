import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	url: v.pipe(v.string(), v.minLength(1, 'Enter a URL'))
});

export type UrlParserInput = v.InferOutput<typeof inputSchema>;

export type UrlQueryEntry = { key: string; value: string };

export type UrlParserOutput = {
	protocol: string;
	username: string;
	password: string;
	hostname: string;
	port: string;
	pathname: string;
	search: string;
	hash: string;
	query: UrlQueryEntry[];
	error?: string;
};

const EMPTY: Omit<UrlParserOutput, 'error'> = {
	protocol: '',
	username: '',
	password: '',
	hostname: '',
	port: '',
	pathname: '',
	search: '',
	hash: '',
	query: []
};

export function run(input: UrlParserInput): UrlParserOutput {
	try {
		const url = new URL(input.url.trim());
		const query: UrlQueryEntry[] = [...url.searchParams.entries()].map(([key, value]) => ({
			key,
			value
		}));
		return {
			protocol: url.protocol,
			username: url.username,
			password: url.password,
			hostname: url.hostname,
			port: url.port,
			pathname: url.pathname,
			search: url.search,
			hash: url.hash,
			query
		};
	} catch {
		return {
			...EMPTY,
			error: 'Invalid URL. Include a scheme, e.g. https://example.com/path?query=1'
		};
	}
}

export const urlParser: ToolDefinition<UrlParserInput, UrlParserOutput> = {
	id: 'url-parser',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['url', 'parse', 'query', 'developer'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['url']
	},
	presets: [
		{
			id: 'basic',
			label: 'Basic URL',
			params: { url: 'https://example.com/path?a=1&b=2#section' }
		},
		{
			id: 'auth',
			label: 'With credentials & port',
			params: { url: 'https://user:pass@example.com:8443/api?tag=a&tag=b' }
		}
	],
	workflow: {
		next: ['query-string-json', 'url-codec']
	},
	metadata: {
		name: 'URL Parser',
		title: 'URL Parser — Break a URL into protocol, host, path & query',
		description:
			'Parse any URL into protocol, username, password, hostname, port, path, hash, and query parameters. Runs locally in your browser.',
		keywords: [
			'url parser',
			'parse url',
			'url breakdown',
			'extract query params',
			'url components'
		],
		related: ['query-string-json', 'url-codec'],
		faq: [
			{
				question: 'Why does it say "Invalid URL"?',
				answer:
					'The value must be a full, absolute URL including a scheme such as https:// or mailto:. Relative paths like /foo?bar=1 are not valid on their own.'
			},
			{
				question: 'How are repeated query keys handled?',
				answer:
					'Each occurrence is listed separately in order, e.g. tag=a&tag=b appears as two entries for "tag".'
			},
			{
				question: 'Is my URL uploaded anywhere?',
				answer: 'No. Parsing uses the browser\u2019s built-in URL API and never leaves your device.'
			}
		],
		howTo: [
			'Paste a full URL, including its scheme',
			'Review the parsed protocol, host, path, and query fields',
			'Copy the JSON breakdown or share the link'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
