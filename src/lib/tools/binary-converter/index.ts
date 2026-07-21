import type { ToolDefinition } from '$engine/types';
import { binaryToText, textToBinary } from '$lib/utils/encoding';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['encode', 'decode'])
});

export type BinaryConverterInput = v.InferOutput<typeof inputSchema>;
export type BinaryConverterOutput = { result: string; error?: string };

const DEFAULT_TEXT = 'Hi';
const SAMPLE_BINARY = '01001000 01101001';

export function run(input: BinaryConverterInput): BinaryConverterOutput {
	try {
		if (input.mode === 'encode') {
			return { result: textToBinary(input.text) };
		}
		return { result: binaryToText(input.text) };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Invalid binary input'
		};
	}
}

export const binaryConverter: ToolDefinition<BinaryConverterInput, BinaryConverterOutput> = {
	id: 'binary-converter',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['binary', 'encode', 'decode', 'bits'],
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
			params: { mode: 'decode', text: SAMPLE_BINARY }
		}
	],
	workflow: {
		next: ['ascii-converter', 'hex-codec', 'base64-codec']
	},
	metadata: {
		name: 'Binary Converter',
		title: 'Binary Converter — Text to UTF-8 binary bytes',
		description:
			'Encode UTF-8 text as 8-bit binary strings or decode binary back to text. Useful for learning bit patterns and debugging—runs in your browser.',
		keywords: ['binary converter', 'text to binary', 'binary to text', 'utf-8 binary'],
		related: ['ascii-converter', 'hex-codec', 'base64-codec'],
		faq: [
			{
				question: 'How is text encoded?',
				answer:
					'Text is encoded as UTF-8 bytes; each byte is shown as an 8-digit binary string separated by spaces.'
			},
			{
				question: 'What binary formats decode correctly?',
				answer:
					'Decode accepts groups of 0/1 bits separated by spaces or commas. Each group must represent one byte (0–255).'
			},
			{
				question: 'Is my data uploaded?',
				answer: 'No. Encoding and decoding happen locally.'
			}
		],
		howTo: ['Paste text or binary', 'Choose Encode or Decode', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
