import type { ToolDefinition } from '$engine/types';
import { decodeMorse, encodeMorse } from '$lib/utils/encoding';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['encode', 'decode'])
});

export type MorseCodecInput = v.InferOutput<typeof inputSchema>;
export type MorseCodecOutput = { result: string; error?: string };

const DEFAULT_TEXT = 'SOS';
const SAMPLE_MORSE = '... --- ...';

export function run(input: MorseCodecInput): MorseCodecOutput {
	try {
		if (input.mode === 'encode') {
			return { result: encodeMorse(input.text) };
		}
		return { result: decodeMorse(input.text) };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Invalid Morse input'
		};
	}
}

export const morseCodec: ToolDefinition<MorseCodecInput, MorseCodecOutput> = {
	id: 'morse-codec',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['morse', 'encode', 'decode', 'telegraph'],
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
			params: { mode: 'decode', text: SAMPLE_MORSE }
		}
	],
	workflow: {
		next: ['rot13', 'ascii-converter']
	},
	metadata: {
		name: 'Morse Code Encoder / Decoder',
		title: 'Morse Code Encoder / Decoder — Dots and dashes',
		description:
			'Convert letters, digits, and common punctuation to International Morse code or decode Morse back to text. Word breaks use / or |—runs in your browser.',
		keywords: ['morse code', 'morse encoder', 'morse decoder', 'dots and dashes'],
		related: ['rot13', 'ascii-converter'],
		faq: [
			{
				question: 'How are words separated in Morse?',
				answer: 'Encode uses / between words. Decode treats / or | as a space between words.'
			},
			{
				question: 'Which characters are supported?',
				answer:
					'Letters A–Z, digits 0–9, and common punctuation. Unsupported characters raise an error in encode mode.'
			},
			{
				question: 'Is audio playback included?',
				answer: 'Not yet—this tool outputs the dot/dash text representation only.'
			}
		],
		howTo: ['Paste text or Morse code', 'Choose Encode or Decode', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
