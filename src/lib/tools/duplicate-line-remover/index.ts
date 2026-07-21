import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string()
});

export type DuplicateLineRemoverInput = v.InferOutput<typeof inputSchema>;
export type DuplicateLineRemoverOutput = {
	result: string;
	removed: number;
	kept: number;
};

export function run(input: DuplicateLineRemoverInput): DuplicateLineRemoverOutput {
	const lines = input.text.replace(/\r\n/g, '\n').split('\n');
	const seen = new Set<string>();
	const keptLines: string[] = [];

	for (const line of lines) {
		if (seen.has(line)) continue;
		seen.add(line);
		keptLines.push(line);
	}

	return {
		result: keptLines.join('\n'),
		removed: lines.length - keptLines.length,
		kept: keptLines.length
	};
}

const SAMPLE_TEXT = 'alpha\nbeta\nalpha\ngamma\nbeta\ndelta\nalpha';

export const duplicateLineRemover: ToolDefinition<
	DuplicateLineRemoverInput,
	DuplicateLineRemoverOutput
> = {
	id: 'duplicate-line-remover',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'duplicates', 'unique', 'lines'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'sample',
			label: 'Sample duplicates',
			params: { text: SAMPLE_TEXT }
		},
		{
			id: 'emails',
			label: 'Email list',
			params: {
				text: 'a@example.com\nb@example.com\na@example.com\nc@example.com\nb@example.com'
			}
		},
		{
			id: 'clear',
			label: 'Clear',
			params: { text: '' }
		}
	],
	workflow: {
		next: ['line-sort', 'word-counter', 'remove-empty-lines']
	},
	metadata: {
		name: 'Duplicate Line Remover',
		title: 'Duplicate Line Remover — Remove duplicate lines online',
		description:
			'Remove duplicate lines from a list while keeping the first occurrence of each line. Free online dedupe tool.',
		keywords: ['remove duplicates', 'unique lines', 'dedupe list', 'duplicate line remover'],
		related: ['line-sort', 'word-counter', 'text-diff'],
		faq: [
			{
				question: 'Which duplicate is kept?',
				answer: 'The first occurrence of each line is kept; later duplicates are removed.'
			},
			{
				question: 'Is matching case-sensitive?',
				answer:
					'Yes. “Apple” and “apple” are treated as different lines. Sort with unique enabled if you want case-insensitive uniqueness.'
			},
			{
				question: 'Do blank lines count?',
				answer:
					'Yes. Empty lines are treated like any other line—only the first blank line is kept.'
			}
		],
		howTo: [
			'Paste your list (one item per line)',
			'Review how many duplicates were removed',
			'Copy the unique result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
