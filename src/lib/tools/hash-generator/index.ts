import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	algorithm: v.picklist(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'])
});

export type HashInput = v.InferOutput<typeof inputSchema>;
export type HashOutput = { hash: string };

const DEFAULT_TEXT = 'ToolHub';

function toHex(buffer: ArrayBuffer) {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function run(input: HashInput): Promise<HashOutput> {
	const data = new TextEncoder().encode(input.text);
	const digest = await crypto.subtle.digest(input.algorithm, data);
	return { hash: toHex(digest) };
}

export const hashGenerator: ToolDefinition<HashInput, HashOutput> = {
	id: 'hash-generator',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['hash', 'sha256', 'sha1', 'checksum', 'crypto'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'algorithm']
	},
	presets: [
		{
			id: 'sha256',
			label: 'SHA-256 sample',
			params: { algorithm: 'SHA-256', text: DEFAULT_TEXT }
		},
		{
			id: 'sha1',
			label: 'SHA-1 sample',
			params: { algorithm: 'SHA-1', text: DEFAULT_TEXT }
		},
		{
			id: 'sha512',
			label: 'SHA-512 sample',
			params: { algorithm: 'SHA-512', text: DEFAULT_TEXT }
		}
	],
	workflow: {
		next: ['base64-codec', 'uuid-generator']
	},
	metadata: {
		name: 'Hash Generator',
		title: 'Hash Generator — SHA-1, SHA-256, SHA-384, and SHA-512',
		description:
			'Generate cryptographic digests for checksums and integrity checks using the Web Crypto API. Your text never leaves the browser.',
		keywords: ['hash generator', 'sha256 hash', 'sha512', 'checksum', 'sha1', 'web crypto hash'],
		related: ['password-generator', 'base64-codec', 'uuid-generator'],
		faq: [
			{
				question: 'Which algorithms are supported?',
				answer: 'SHA-1, SHA-256, SHA-384, and SHA-512 via the browser Web Crypto API.'
			},
			{
				question: 'Is hashing private?',
				answer:
					'Yes. Digests are computed locally. Nothing is uploaded—suitable for hashing config values or sample strings without sending them to a server.'
			},
			{
				question: 'Can I reverse a hash to get the original text?',
				answer:
					'No. Cryptographic hashes are one-way. Use this for integrity checks and fingerprints, not for storing recoverable secrets (use a proper password hash with salt for passwords).'
			}
		],
		howTo: ['Enter the text to hash', 'Select an algorithm (e.g. SHA-256)', 'Copy the hex digest']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['algorithm'] }
};
