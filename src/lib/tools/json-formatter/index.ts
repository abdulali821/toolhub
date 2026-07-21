import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	json: v.pipe(v.string(), v.minLength(1, 'Paste JSON to format')),
	indent: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(8)), 2)
});

export type JsonFormatterInput = v.InferOutput<typeof inputSchema>;
export type JsonFormatterOutput = {
	formatted: string;
	valid: boolean;
	error?: string;
};

export function run(input: JsonFormatterInput): JsonFormatterOutput {
	try {
		const parsed = JSON.parse(input.json) as unknown;
		const indent = input.indent ?? 2;
		return {
			formatted: JSON.stringify(parsed, null, indent),
			valid: true
		};
	} catch (err) {
		return {
			formatted: input.json,
			valid: false,
			error: err instanceof Error ? err.message : 'Invalid JSON'
		};
	}
}

const DEFAULT_JSON = '{\n  "hello": "world"\n}';

export const jsonFormatter: ToolDefinition<JsonFormatterInput, JsonFormatterOutput> = {
	id: 'json-formatter',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['json', 'format', 'beautify', 'dev'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['json', 'indent'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'pretty',
			label: 'Pretty Print',
			params: { indent: '2', json: DEFAULT_JSON }
		},
		{
			id: 'minify',
			label: 'Minify',
			params: { indent: '0' }
		},
		{
			id: 'validate',
			label: 'Validate sample',
			params: { indent: '2', json: DEFAULT_JSON }
		}
	],
	workflow: {
		next: ['json-validator', 'json-minifier', 'json-compare', 'json-to-yaml']
	},
	metadata: {
		name: 'JSON Formatter',
		title: 'JSON Formatter — Beautify and validate JSON',
		description:
			'Paste JSON to format, validate, and beautify it instantly in your browser. Free online JSON formatter.',
		keywords: ['json formatter', 'json beautify', 'validate json', 'pretty print json'],
		related: ['json-validator', 'json-minifier', 'json-compare', 'json-to-yaml'],
		faq: [
			{
				question: 'Does my JSON leave my device?',
				answer: 'No. Formatting runs entirely in your browser. Nothing is uploaded to our servers.'
			},
			{
				question: 'Can I minify JSON too?',
				answer: 'Set indentation to 0 to produce compact, minified JSON output.'
			},
			{
				question: 'Can I share my JSON?',
				answer:
					'Yes. Use Share link to copy a URL with your input and indent settings (large payloads may be omitted from the URL).'
			}
		],
		howTo: ['Paste your JSON', 'Choose indentation', 'Copy the formatted result']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['valid'] }
};
