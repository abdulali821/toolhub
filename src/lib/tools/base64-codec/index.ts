import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['encode', 'decode'])
});

export type Base64Input = v.InferOutput<typeof inputSchema>;
export type Base64Output = { result: string; error?: string };

const DEFAULT_TEXT = 'Hello HeyTools';
const SAMPLE_ENCODED = 'SGVsbG8gVG9vbEh1Yg==';

function encode(text: string) {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function decode(text: string) {
	const binary = atob(text.trim());
	const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

export function run(input: Base64Input): Base64Output {
	try {
		if (input.mode === 'encode') return { result: encode(input.text) };
		return { result: decode(input.text) };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Invalid Base64 input'
		};
	}
}

export const base64Codec: ToolDefinition<Base64Input, Base64Output> = {
	id: 'base64-codec',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['base64', 'encode', 'decode', 'converter'],
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
		next: ['hex-codec', 'unicode-escape', 'url-codec', 'hash-generator']
	},
	metadata: {
		name: 'Base64 Encoder / Decoder',
		title: 'Base64 Encoder / Decoder — Encode and decode UTF-8 text',
		description:
			'Encode text to Base64 or decode Base64 back to UTF-8. Useful for data URLs, API payloads, and quick debugging—runs fully in your browser.',
		keywords: [
			'base64 encode',
			'base64 decode',
			'base64 converter',
			'UTF-8 base64',
			'encode base64 online'
		],
		related: ['hex-codec', 'unicode-escape', 'url-codec', 'hash-generator'],
		faq: [
			{
				question: 'Is Unicode supported?',
				answer:
					'Yes. Text is encoded as UTF-8 before Base64 conversion, so emoji and non-ASCII characters round-trip correctly.'
			},
			{
				question: 'Does my data leave the browser?',
				answer:
					'No. Encoding and decoding happen locally. Prefer that for tokens, config snippets, or anything you would not paste into a random website.'
			},
			{
				question: 'Why do I get an “Invalid Base64” error?',
				answer:
					'Decode mode expects valid Base64 (standard alphabet and padding). Extra whitespace is trimmed, but corrupted or truncated strings will fail.'
			}
		],
		howTo: ['Paste your text or Base64 string', 'Choose Encode or Decode', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
