import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const URL_SAFE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

export const ALPHABET_PRESETS = {
	'url-safe': URL_SAFE_ALPHABET,
	alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
	lowercase: 'abcdefghijklmnopqrstuvwxyz0123456789',
	uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
	numeric: '0123456789',
	hex: '0123456789abcdef'
} as const;

export const inputSchema = v.object({
	size: v.pipe(v.number(), v.integer(), v.minValue(8), v.maxValue(64)),
	alphabet: v.pipe(v.string(), v.minLength(2, 'Alphabet needs at least 2 unique characters')),
	count: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(50))
});

export type NanoidGeneratorInput = v.InferOutput<typeof inputSchema>;
export type NanoidGeneratorOutput = {
	ids: string[];
	joined: string;
	error?: string;
};

/** Mask-based rejection sampling — same approach as the `nanoid` package, unbiased for any alphabet size. */
function nanoid(alphabet: string, size: number): string {
	const mask = (2 << (31 - Math.clz32(alphabet.length - 1 || 1))) - 1;
	const step = Math.ceil((1.6 * mask * size) / alphabet.length) || size;
	let id = '';

	while (true) {
		const bytes = new Uint8Array(step);
		crypto.getRandomValues(bytes);
		for (let i = 0; i < step; i++) {
			const char = alphabet[bytes[i]! & mask];
			if (char !== undefined) {
				id += char;
				if (id.length === size) return id;
			}
		}
	}
}

export function run(input: NanoidGeneratorInput): NanoidGeneratorOutput {
	const alphabet = [...new Set(input.alphabet.split(''))].join('');

	if (alphabet.length < 2) {
		return { ids: [], joined: '', error: 'Alphabet needs at least 2 unique characters' };
	}

	const ids = Array.from({ length: input.count }, () => nanoid(alphabet, input.size));
	return { ids, joined: ids.join('\n') };
}

export const nanoidGenerator: ToolDefinition<NanoidGeneratorInput, NanoidGeneratorOutput> = {
	id: 'nanoid-generator',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['nanoid', 'id', 'generator'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['size', 'count']
	},
	presets: [
		{ id: 'default', label: 'Default (21 chars)', params: { size: '21', count: '1' } },
		{ id: 'short', label: 'Short IDs (10 chars)', params: { size: '10', count: '10' } },
		{ id: 'batch', label: 'Batch of 20', params: { size: '21', count: '20' } }
	],
	workflow: {
		next: ['uuid-generator', 'random-string-generator']
	},
	metadata: {
		name: 'NanoID Generator',
		title: 'NanoID Generator — Secure, URL-Friendly Unique IDs',
		description:
			'Generate cryptographically secure, URL-friendly NanoIDs with a custom size and alphabet. Uses the Web Crypto API, entirely in your browser.',
		keywords: ['nanoid generator', 'nanoid', 'unique id generator', 'url-safe id', 'random id'],
		related: ['uuid-generator', 'random-string-generator', 'password-generator'],
		faq: [
			{
				question: 'How is NanoID different from UUID?',
				answer:
					'NanoIDs are shorter and URL-friendly by default (using A-Z, a-z, 0-9, _, -), while UUIDs are a fixed 36-character format. Both are suitable as unique identifiers.'
			},
			{
				question: 'Are the generated IDs cryptographically secure?',
				answer:
					'Yes. IDs are generated with crypto.getRandomValues() using rejection sampling to avoid bias, the same approach used by the nanoid package.'
			},
			{
				question: 'Can I use a custom alphabet?',
				answer:
					'Yes. Switch to a preset like numeric, hex, or lowercase, or type your own set of characters. Duplicate characters are ignored.'
			}
		],
		howTo: [
			'Set the ID length (8–64) and how many to generate (1–50)',
			'Optionally choose a different character alphabet',
			'Copy or download the generated IDs'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['size', 'count'] }
};
