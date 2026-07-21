import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['encode', 'decode'])
});

export type UrlCodecInput = v.InferOutput<typeof inputSchema>;
export type UrlCodecOutput = { result: string; error?: string };

const DEFAULT_TEXT = 'hello world & tools=1';
const SAMPLE_ENCODED = 'hello%20world%20%26%20tools%3D1';

export function run(input: UrlCodecInput): UrlCodecOutput {
	try {
		if (input.mode === 'encode') return { result: encodeURIComponent(input.text) };
		return { result: decodeURIComponent(input.text) };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Invalid URL encoding'
		};
	}
}

export const urlCodec: ToolDefinition<UrlCodecInput, UrlCodecOutput> = {
	id: 'url-codec',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['url', 'encode', 'decode', 'percent-encoding'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'mode']
	},
	presets: [
		{
			id: 'encode',
			label: 'Encode sample',
			params: { mode: 'encode', text: DEFAULT_TEXT }
		},
		{
			id: 'decode',
			label: 'Decode sample',
			params: { mode: 'decode', text: SAMPLE_ENCODED }
		}
	],
	workflow: {
		next: ['hex-codec', 'unicode-escape', 'slugify', 'base64-codec', 'html-codec']
	},
	metadata: {
		name: 'URL Encoder / Decoder',
		title: 'URL Encoder / Decoder — Percent-encode query and path values',
		description:
			'Percent-encode or decode URL components for query strings, path segments, and form values. Uses encodeURIComponent / decodeURIComponent in your browser.',
		keywords: [
			'url encode',
			'url decode',
			'percent encoding',
			'encodeURIComponent',
			'query string encode'
		],
		related: ['hex-codec', 'unicode-escape', 'slugify', 'base64-codec', 'html-codec'],
		faq: [
			{
				question: 'Is this the same as encodeURI?',
				answer:
					'No. This tool uses encodeURIComponent / decodeURIComponent, which safely encodes reserved characters like &, =, and / inside a single component—not a full URL.'
			},
			{
				question: 'When should I encode vs slugify?',
				answer:
					'Slugify makes readable kebab-case paths from titles. URL encode when you need to safely put arbitrary text (spaces, symbols) into a query parameter or path segment.'
			},
			{
				question: 'Is my input uploaded?',
				answer: 'No. Encoding and decoding run entirely in your browser.'
			}
		],
		howTo: [
			'Paste the text or encoded string',
			'Choose Encode or Decode',
			'Copy the result into your URL or code'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
