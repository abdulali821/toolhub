import type { ToolDefinition } from '$engine/types';
import { hexToText, textToHex } from '$lib/utils/encoding';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['encode', 'decode'])
});

export type HexCodecInput = v.InferOutput<typeof inputSchema>;
export type HexCodecOutput = { result: string; error?: string };

const DEFAULT_TEXT = 'Hello';
const SAMPLE_HEX = '48 65 6c 6c 6f';

export function run(input: HexCodecInput): HexCodecOutput {
	try {
		if (input.mode === 'encode') {
			return { result: textToHex(input.text) };
		}
		return { result: hexToText(input.text) };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Invalid hex input'
		};
	}
}

export const hexCodec: ToolDefinition<HexCodecInput, HexCodecOutput> = {
	id: 'hex-codec',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['hex', 'encode', 'decode', 'utf-8'],
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
			params: { mode: 'decode', text: SAMPLE_HEX }
		}
	],
	workflow: {
		next: ['binary-converter', 'base64-codec', 'unicode-escape']
	},
	metadata: {
		name: 'Hex Encoder / Decoder',
		title: 'Hex Encoder / Decoder — UTF-8 text and hex bytes',
		description:
			'Encode UTF-8 text to hexadecimal bytes or decode hex back to readable text. Accepts spaced, compact, or 0x-prefixed hex—runs locally.',
		keywords: ['hex encode', 'hex decode', 'text to hex', 'hex to text', 'hexadecimal converter'],
		related: ['binary-converter', 'base64-codec', 'unicode-escape'],
		faq: [
			{
				question: 'Which hex formats are accepted?',
				answer:
					'Decode accepts spaced bytes (48 65 6c), compact strings (48656c6c6f), or 0x prefixes. Length must be even.'
			},
			{
				question: 'Is this the same as ASCII codes?',
				answer:
					'No. Hex codec works on UTF-8 bytes. Use ASCII Converter for decimal code points per character.'
			},
			{
				question: 'Does my data leave the device?',
				answer: 'No. All conversion runs in your browser.'
			}
		],
		howTo: ['Paste text or hex', 'Choose Encode or Decode', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
