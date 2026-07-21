import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	length: v.pipe(v.number(), v.integer(), v.minValue(4), v.maxValue(128)),
	uppercase: v.boolean(),
	lowercase: v.boolean(),
	numbers: v.boolean(),
	symbols: v.boolean()
});

export type PasswordInput = v.InferOutput<typeof inputSchema>;
export type PasswordOutput = { password: string };

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMS = '0123456789';
const SYMS = '!@#$%^&*()-_=+[]{};:,.<>?';

function pick(charset: string) {
	const bytes = new Uint32Array(1);
	crypto.getRandomValues(bytes);
	return charset[bytes[0]! % charset.length]!;
}

export function run(input: PasswordInput): PasswordOutput {
	let charset = '';
	const required: string[] = [];

	if (input.uppercase) {
		charset += UPPER;
		required.push(pick(UPPER));
	}
	if (input.lowercase) {
		charset += LOWER;
		required.push(pick(LOWER));
	}
	if (input.numbers) {
		charset += NUMS;
		required.push(pick(NUMS));
	}
	if (input.symbols) {
		charset += SYMS;
		required.push(pick(SYMS));
	}

	if (!charset) {
		return { password: '' };
	}

	const length = Math.max(input.length, required.length);
	const chars = [...required];

	while (chars.length < length) {
		chars.push(pick(charset));
	}

	// Fisher–Yates shuffle with crypto bits
	for (let i = chars.length - 1; i > 0; i--) {
		const bytes = new Uint32Array(1);
		crypto.getRandomValues(bytes);
		const j = bytes[0]! % (i + 1);
		[chars[i], chars[j]] = [chars[j]!, chars[i]!];
	}

	return { password: chars.join('') };
}

export const passwordGenerator: ToolDefinition<PasswordInput, PasswordOutput> = {
	id: 'password-generator',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['password', 'security', 'generator', 'random'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['length', 'uppercase', 'lowercase', 'numbers', 'symbols']
	},
	presets: [
		{
			id: 'developer',
			label: 'Developer Password',
			params: {
				length: '24',
				uppercase: 'true',
				lowercase: 'true',
				numbers: 'true',
				symbols: 'true'
			}
		},
		{
			id: 'strong',
			label: 'Strong Password',
			params: {
				length: '32',
				uppercase: 'true',
				lowercase: 'true',
				numbers: 'true',
				symbols: 'true'
			}
		},
		{
			id: 'pin',
			label: 'PIN Generator',
			params: {
				length: '6',
				uppercase: 'false',
				lowercase: 'false',
				numbers: 'true',
				symbols: 'false'
			}
		}
	],
	workflow: {
		next: ['uuid-generator', 'hash-generator']
	},
	metadata: {
		name: 'Password Generator',
		title: 'Password Generator — Strong random passwords',
		description:
			'Generate strong, random passwords with customizable length and character sets. Runs locally in your browser.',
		keywords: ['password generator', 'random password', 'secure password'],
		related: ['uuid-generator', 'hash-generator'],
		faq: [
			{
				question: 'Are passwords uploaded?',
				answer:
					'No. Passwords are generated locally with the Web Crypto API and never leave your device.'
			},
			{
				question: 'How random are the passwords?',
				answer:
					'Characters are chosen using cryptographically secure random values from the browser.'
			},
			{
				question: 'Does Share link include my password?',
				answer:
					'No. Shared URLs only include length and character-set options—never the generated password.'
			}
		],
		howTo: ['Set length and character options', 'Generate a random password', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['length'] }
};
