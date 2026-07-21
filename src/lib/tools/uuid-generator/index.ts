import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	count: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
	version: v.picklist(['v4'])
});

export type UuidInput = v.InferOutput<typeof inputSchema>;
export type UuidOutput = { uuids: string[] };

function randomUuid(): string {
	return crypto.randomUUID();
}

export function run(input: UuidInput): UuidOutput {
	const uuids = Array.from({ length: input.count }, () => randomUuid());
	return { uuids };
}

export const uuidGenerator: ToolDefinition<UuidInput, UuidOutput> = {
	id: 'uuid-generator',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['uuid', 'guid', 'generator', 'id'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['count']
	},
	presets: [
		{ id: 'one', label: '1 UUID', params: { count: '1' } },
		{ id: 'ten', label: '10 UUIDs', params: { count: '10' } },
		{ id: 'fifty', label: '50 UUIDs', params: { count: '50' } }
	],
	workflow: {
		next: ['password-generator', 'hash-generator']
	},
	metadata: {
		name: 'UUID Generator',
		title: 'UUID Generator — Create random UUID v4 / GUIDs',
		description:
			'Generate one or many RFC 4122 version 4 UUIDs (GUIDs) with the Web Crypto API. Ideal for test data, primary keys, and request IDs—created locally in your browser.',
		keywords: ['uuid generator', 'guid generator', 'uuid v4', 'random uuid', 'generate uuid'],
		related: ['password-generator', 'hash-generator', 'json-formatter'],
		faq: [
			{
				question: 'Which UUID version is generated?',
				answer: 'Version 4 (random) UUIDs via crypto.randomUUID() in supporting browsers.'
			},
			{
				question: 'Are UUIDs stored or uploaded?',
				answer: 'No. Generation happens locally and nothing is sent to our servers.'
			},
			{
				question: 'How many can I generate at once?',
				answer:
					'Up to 100 per run. Use presets for 1, 10, or 50, then copy or download the list for fixtures and seed data.'
			}
		],
		howTo: ['Choose how many UUIDs you need', 'Generate the list', 'Copy or download the IDs']
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['count'] }
};
