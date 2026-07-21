import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	min: v.pipe(v.number(), v.integer()),
	max: v.pipe(v.number(), v.integer()),
	count: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100))
});

export type RandomNumberInput = v.InferOutput<typeof inputSchema>;
export type RandomNumberOutput = { numbers: number[]; error?: string };

function randomIntInclusive(min: number, max: number): number {
	const low = Math.min(min, max);
	const high = Math.max(min, max);
	const range = high - low + 1;
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	return low + (array[0]! % range);
}

export function run(input: RandomNumberInput): RandomNumberOutput {
	if (!Number.isFinite(input.min) || !Number.isFinite(input.max)) {
		return { numbers: [], error: 'Min and max must be valid integers' };
	}
	if (input.min === input.max) {
		return {
			numbers: Array.from({ length: input.count }, () => input.min)
		};
	}

	const numbers = Array.from({ length: input.count }, () =>
		randomIntInclusive(input.min, input.max)
	);
	return { numbers };
}

export const randomNumber: ToolDefinition<RandomNumberInput, RandomNumberOutput> = {
	id: 'random-number',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['random', 'number', 'integer', 'generator'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['min', 'max', 'count']
	},
	presets: [
		{ id: 'dice', label: 'Dice (1–6)', params: { min: '1', max: '6', count: '1' } },
		{ id: 'percent', label: '0–100 ×5', params: { min: '0', max: '100', count: '5' } },
		{ id: 'lottery', label: '1–49 ×6', params: { min: '1', max: '49', count: '6' } }
	],
	workflow: {
		next: ['uuid-generator', 'password-generator']
	},
	metadata: {
		name: 'Random Number Generator',
		title: 'Random Number Generator — Integers in a range',
		description:
			'Generate cryptographically strong random integers in a custom range. Free online random number generator.',
		keywords: ['random number', 'random integer', 'number generator', 'dice roller'],
		related: ['uuid-generator', 'password-generator'],
		faq: [
			{
				question: 'Are the numbers truly random?',
				answer:
					'Integers are produced with the Web Crypto API (crypto.getRandomValues), which is suitable for most non-cryptographic and many security-sensitive uses in the browser.'
			},
			{
				question: 'Why isn’t the result in the share URL?',
				answer:
					'Only min, max, and count are shared so links reproduce your settings—not a specific random draw.'
			},
			{
				question: 'What if min is greater than max?',
				answer:
					'The range is treated inclusively either way; min and max are swapped automatically.'
			}
		],
		howTo: [
			'Set the minimum, maximum, and how many numbers to generate',
			'Click Generate (or change a shared URL option to regenerate)',
			'Copy the result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['count'] }
};
