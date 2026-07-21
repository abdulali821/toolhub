import type { ToolDefinition } from '$engine/types';
import { asciiCodesToText, textToAsciiCodes } from '$lib/utils/encoding';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['encode', 'decode'])
});

export type AsciiConverterInput = v.InferOutput<typeof inputSchema>;
export type AsciiConverterOutput = { result: string; error?: string };

const DEFAULT_TEXT = 'Hello';
const SAMPLE_CODES = '72 101 108 108 111';

export function run(input: AsciiConverterInput): AsciiConverterOutput {
	try {
		if (input.mode === 'encode') {
			return { result: textToAsciiCodes(input.text) };
		}
		return { result: asciiCodesToText(input.text) };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Invalid ASCII codes'
		};
	}
}

export const asciiConverter: ToolDefinition<AsciiConverterInput, AsciiConverterOutput> = {
	id: 'ascii-converter',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['ascii', 'encode', 'decode', 'code points'],
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
			params: { mode: 'decode', text: SAMPLE_CODES }
		}
	],
	workflow: {
		next: ['binary-converter', 'hex-codec', 'unicode-escape']
	},
	metadata: {
		name: 'ASCII Converter',
		title: 'ASCII Converter — Text to decimal code points',
		description:
			'Convert text to decimal ASCII/Unicode code points or decode code lists back to text. Supports space, comma, or semicolon separators—runs locally in your browser.',
		keywords: ['ascii converter', 'ascii codes', 'code points', 'decimal ascii', 'unicode codes'],
		related: ['binary-converter', 'hex-codec', 'unicode-escape'],
		faq: [
			{
				question: 'What separators are supported for decode?',
				answer:
					'Decode accepts code points separated by spaces, commas, or semicolons (e.g. 72 101 108 108 111).'
			},
			{
				question: 'Does this support emoji and Unicode?',
				answer:
					'Yes. Encode outputs decimal code points for any Unicode character, not just 7-bit ASCII.'
			},
			{
				question: 'Does my text leave the browser?',
				answer: 'No. Conversion runs entirely on your device.'
			}
		],
		howTo: ['Paste text or code points', 'Choose Encode or Decode', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
