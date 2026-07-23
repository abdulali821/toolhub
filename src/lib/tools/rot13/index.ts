import type { ToolDefinition } from '$engine/types';
import { rot13 as rot13Transform } from '$lib/utils/encoding';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string()
});

export type Rot13Input = v.InferOutput<typeof inputSchema>;
export type Rot13Output = { result: string };

const DEFAULT_TEXT = 'Hello HeyTools';

export function run(input: Rot13Input): Rot13Output {
	return { result: rot13Transform(input.text) };
}

export const rot13: ToolDefinition<Rot13Input, Rot13Output> = {
	id: 'rot13',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['rot13', 'cipher', 'caesar'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['text']
	},
	presets: [
		{
			id: 'sample',
			label: 'Sample text',
			params: { text: DEFAULT_TEXT }
		}
	],
	workflow: {
		next: ['morse-codec', 'base64-codec']
	},
	metadata: {
		name: 'ROT13',
		title: 'ROT13 — Symmetric letter rotation cipher',
		description:
			'Apply ROT13 to rotate Latin letters by 13 positions. Encoding and decoding use the same operation—handy for spoiler tags and quick obfuscation.',
		keywords: ['rot13', 'rot 13 encoder', 'caesar cipher', 'letter rotation'],
		related: ['morse-codec', 'base64-codec'],
		faq: [
			{
				question: 'Is ROT13 secure encryption?',
				answer:
					'No. ROT13 is a trivial reversible transform for obfuscation only—not suitable for protecting sensitive data.'
			},
			{
				question: 'Why encode and decode look the same?',
				answer:
					'ROT13 is self-inverse: applying it twice returns the original text, so one mode handles both directions.'
			},
			{
				question: 'Does my text leave the browser?',
				answer: 'No. The cipher runs locally on your device.'
			}
		],
		howTo: ['Paste text', 'Read the ROT13 output', 'Apply ROT13 again to reverse']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
