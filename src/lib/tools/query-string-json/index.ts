import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	mode: v.picklist(['to-json', 'to-query']),
	text: v.string()
});

export type QueryStringJsonInput = v.InferOutput<typeof inputSchema>;
export type QueryStringJsonOutput = { result: string; error?: string };

/** Parse a query string (with or without a leading "?") into an object, using arrays for repeated keys. */
export function queryStringToJson(text: string): Record<string, string | string[]> {
	const trimmed = text.trim().replace(/^\?/, '');
	const params = new URLSearchParams(trimmed);
	const out: Record<string, string | string[]> = {};
	for (const key of new Set(params.keys())) {
		const values = params.getAll(key);
		out[key] = values.length > 1 ? values : values[0]!;
	}
	return out;
}

/** Serialize a flat JSON object (string / string[] / primitive values) into a query string. */
export function jsonToQueryString(json: unknown): string {
	if (typeof json !== 'object' || json === null || Array.isArray(json)) {
		throw new Error('Expected a JSON object of key/value pairs');
	}
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
		if (Array.isArray(value)) {
			for (const item of value) params.append(key, String(item));
		} else if (value !== undefined) {
			params.append(key, value === null ? '' : String(value));
		}
	}
	return params.toString();
}

export function run(input: QueryStringJsonInput): QueryStringJsonOutput {
	const text = input.text ?? '';
	if (!text.trim()) return { result: '' };

	if (input.mode === 'to-json') {
		try {
			return { result: JSON.stringify(queryStringToJson(text), null, 2) };
		} catch (err) {
			return {
				result: '',
				error: err instanceof Error ? err.message : 'Failed to parse query string'
			};
		}
	}

	try {
		const parsed = JSON.parse(text);
		return { result: jsonToQueryString(parsed) };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Enter valid JSON to convert to a query string'
		};
	}
}

export const queryStringJson: ToolDefinition<QueryStringJsonInput, QueryStringJsonOutput> = {
	id: 'query-string-json',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['querystring', 'json', 'url', 'convert'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['mode', 'text'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'to-json',
			label: 'Query string → JSON',
			params: { mode: 'to-json', text: 'a=1&b=2&tag=x&tag=y' }
		},
		{
			id: 'to-query',
			label: 'JSON → query string',
			params: { mode: 'to-query', text: '{"a":"1","b":"2","tag":["x","y"]}' }
		}
	],
	workflow: {
		next: ['url-parser', 'url-codec', 'json-formatter']
	},
	metadata: {
		name: 'Query String ↔ JSON',
		title: 'Query String to JSON Converter — and back',
		description:
			'Convert a URL query string into pretty JSON, or turn a JSON object back into a query string. Repeated keys become arrays.',
		keywords: [
			'query string to json',
			'json to query string',
			'querystring converter',
			'url params to json'
		],
		related: ['url-parser', 'url-codec', 'json-formatter'],
		faq: [
			{
				question: 'How are repeated keys handled?',
				answer:
					'When converting to JSON, a key that appears more than once (e.g. tag=x&tag=y) becomes an array: "tag": ["x", "y"]. Single occurrences stay as plain strings.'
			},
			{
				question: 'What JSON shape does "JSON → query string" expect?',
				answer:
					'A flat object whose values are strings, numbers, booleans, or arrays of those. Arrays are serialized as repeated keys.'
			},
			{
				question: 'Does the leading "?" matter?',
				answer:
					'No. You can paste a query string with or without a leading "?" — it is stripped automatically.'
			},
			{
				question: 'Is anything sent to a server?',
				answer:
					'No. Conversion happens locally using the browser\u2019s URLSearchParams and JSON APIs.'
			}
		],
		howTo: [
			'Choose "Query string → JSON" or "JSON → query string"',
			'Paste your input (query string or JSON object)',
			'Copy the converted result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
