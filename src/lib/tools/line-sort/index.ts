import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	order: v.picklist(['asc', 'desc']),
	unique: v.boolean()
});

export type LineSortInput = v.InferOutput<typeof inputSchema>;
export type LineSortOutput = { result: string; lines: number };

export function run(input: LineSortInput): LineSortOutput {
	let lines = input.text.replace(/\r\n/g, '\n').split('\n');

	if (input.unique) {
		const seen = new Set<string>();
		lines = lines.filter((line) => {
			if (seen.has(line)) return false;
			seen.add(line);
			return true;
		});
	}

	lines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
	if (input.order === 'desc') lines.reverse();

	return {
		result: lines.join('\n'),
		lines: lines.length
	};
}

const SAMPLE_TEXT = 'banana\napple\nCherry\napple\ndate\nbanana';

export const lineSort: ToolDefinition<LineSortInput, LineSortOutput> = {
	id: 'line-sort',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'sort', 'lines', 'unique'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'order', 'unique'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'asc',
			label: 'A → Z',
			params: { text: SAMPLE_TEXT, order: 'asc', unique: 'false' }
		},
		{
			id: 'desc-unique',
			label: 'Z → A unique',
			params: { text: SAMPLE_TEXT, order: 'desc', unique: 'true' }
		},
		{
			id: 'names',
			label: 'Sort names',
			params: {
				text: 'Zoe\nAlex\nMia\nJordan\nAlex',
				order: 'asc',
				unique: 'true'
			}
		}
	],
	workflow: {
		next: ['text-diff', 'word-counter', 'trim-lines']
	},
	metadata: {
		name: 'Line Sort',
		title: 'Line Sort — Sort lines A–Z or Z–A online',
		description:
			'Sort lines alphabetically ascending or descending. Optionally remove duplicates while sorting. Free online line sorter.',
		keywords: ['sort lines', 'alphabetical sort', 'sort list', 'unique lines'],
		related: ['text-diff', 'word-counter', 'duplicate-line-remover'],
		faq: [
			{
				question: 'How are lines compared?',
				answer:
					'Lines are sorted with locale-aware comparison that ignores case differences and handles numbers naturally (e.g. 2 before 10).'
			},
			{
				question: 'What does Unique do?',
				answer: 'When enabled, duplicate lines are removed (first occurrence kept) before sorting.'
			},
			{
				question: 'Is my text uploaded?',
				answer: 'No. Sorting runs entirely in your browser.'
			}
		],
		howTo: [
			'Paste one item per line',
			'Choose A–Z or Z–A and optionally Unique',
			'Copy the sorted result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['order', 'unique'] }
};
