import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	length: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(512)),
	lowercase: v.boolean(),
	uppercase: v.boolean(),
	digits: v.boolean(),
	symbols: v.boolean()
});

export type RandomStringGeneratorInput = v.InferOutput<typeof inputSchema>;
export type RandomStringGeneratorOutput = { result: string };

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?';

function pick(charset: string) {
	const bytes = new Uint32Array(1);
	crypto.getRandomValues(bytes);
	return charset[bytes[0]! % charset.length]!;
}

export function run(input: RandomStringGeneratorInput): RandomStringGeneratorOutput {
	let charset = '';
	if (input.lowercase) charset += LOWER;
	if (input.uppercase) charset += UPPER;
	if (input.digits) charset += DIGITS;
	if (input.symbols) charset += SYMBOLS;

	if (!charset) return { result: '' };

	const length = Math.min(512, Math.max(1, input.length));
	const chars = Array.from({ length }, () => pick(charset));
	return { result: chars.join('') };
}

export const randomStringGenerator: ToolDefinition<
	RandomStringGeneratorInput,
	RandomStringGeneratorOutput
> = {
	id: 'random-string-generator',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['random', 'string', 'generator', 'token'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['length', 'lowercase', 'uppercase', 'digits', 'symbols']
	},
	workflow: {
		next: ['password-generator', 'uuid-generator', 'fake-data-generator']
	},
	metadata: {
		name: 'Random String Generator',
		title: 'Random String Generator — Secure random strings',
		description:
			'Generate random strings with customizable length and character sets using crypto.getRandomValues. Ideal for tokens, IDs, and test fixtures.',
		keywords: ['random string generator', 'random text', 'token generator'],
		related: ['password-generator', 'uuid-generator', 'fake-data-generator'],
		faq: [
			{
				question: 'How random are the strings?',
				answer:
					'Characters are chosen with cryptographically secure random values from the Web Crypto API.'
			},
			{
				question: 'Does Share link include my string?',
				answer: 'No. Shared URLs only store length and charset options—not the generated output.'
			}
		],
		howTo: ['Choose length and character sets', 'Generate a random string', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['length'] }
};
