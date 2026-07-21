import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	json: v.pipe(v.string(), v.minLength(1, 'Paste JSON to minify'))
});

export type JsonMinifierInput = v.InferOutput<typeof inputSchema>;
export type JsonMinifierOutput = {
	minified: string;
	valid: boolean;
	error?: string;
	originalBytes: number;
	minifiedBytes: number;
};

export function run(input: JsonMinifierInput): JsonMinifierOutput {
	const originalBytes = new TextEncoder().encode(input.json).length;
	try {
		const parsed = JSON.parse(input.json) as unknown;
		const minified = JSON.stringify(parsed);
		const minifiedBytes = new TextEncoder().encode(minified).length;
		return { minified, valid: true, originalBytes, minifiedBytes };
	} catch (err) {
		return {
			minified: input.json,
			valid: false,
			error: err instanceof Error ? err.message : 'Invalid JSON',
			originalBytes,
			minifiedBytes: originalBytes
		};
	}
}

const DEFAULT_JSON = '{\n  "hello": "world",\n  "items": [1, 2, 3]\n}';

export const jsonMinifier: ToolDefinition<JsonMinifierInput, JsonMinifierOutput> = {
	id: 'json-minifier',
	version: '1.0.0',
	category: 'data',
	mode: 'instant',
	status: 'stable',
	tags: ['json', 'minify', 'compress', 'dev'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['json'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'pretty',
			label: 'Pretty sample',
			params: { json: DEFAULT_JSON }
		},
		{
			id: 'compact-object',
			label: 'Nested object',
			params: { json: '{"user":{"name":"Ada","roles":["admin","dev"]}}' }
		}
	],
	workflow: {
		next: ['json-formatter', 'json-validator', 'json-to-yaml']
	},
	metadata: {
		name: 'JSON Minifier',
		title: 'JSON Minifier — Compress JSON to one line',
		description:
			'Minify JSON by removing whitespace. See byte savings and copy compact output for APIs, logs, or storage—all in your browser.',
		keywords: ['json minifier', 'minify json', 'compress json', 'json compact'],
		related: ['json-formatter', 'json-validator', 'json-to-yaml'],
		faq: [
			{
				question: 'Does minifying change my data?',
				answer:
					'No. Minification removes insignificant whitespace only. Parsed values stay the same.'
			},
			{
				question: 'What do the byte counts mean?',
				answer:
					'Original and minified sizes use UTF-8 byte length—useful for estimating payload size over the wire.'
			},
			{
				question: 'Is my JSON uploaded?',
				answer: 'No. Minification runs locally in your browser.'
			}
		],
		howTo: ['Paste JSON', 'Copy the minified one-line output', 'Compare byte savings']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte'),
		layout: 'editor'
	},
	analytics: { eventName: 'tool_run', props: ['valid'] }
};
