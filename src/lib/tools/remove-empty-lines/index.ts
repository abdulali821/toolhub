import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string()
});

export type RemoveEmptyLinesInput = v.InferOutput<typeof inputSchema>;
export type RemoveEmptyLinesOutput = {
	result: string;
	removed: number;
};

export function run(input: RemoveEmptyLinesInput): RemoveEmptyLinesOutput {
	if (input.text === '') {
		return { result: '', removed: 0 };
	}

	const lines = input.text.replace(/\r\n/g, '\n').split('\n');
	const kept = lines.filter((line) => line.trim() !== '');

	return {
		result: kept.join('\n'),
		removed: lines.length - kept.length
	};
}

const SAMPLE_TEXT = 'alpha\n\n  \n\nbeta\n   \ngamma\n';

export const removeEmptyLines: ToolDefinition<RemoveEmptyLinesInput, RemoveEmptyLinesOutput> = {
	id: 'remove-empty-lines',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'lines', 'clean', 'empty'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'sample',
			label: 'Sample with blanks',
			params: { text: SAMPLE_TEXT }
		},
		{
			id: 'list',
			label: 'Messy list',
			params: {
				text: 'apple\n\nbanana\n\t\ncherry\n\n\n'
			}
		},
		{
			id: 'clear',
			label: 'Clear',
			params: { text: '' }
		}
	],
	workflow: {
		next: ['trim-lines', 'whitespace-cleaner', 'duplicate-line-remover']
	},
	metadata: {
		name: 'Remove Empty Lines',
		title: 'Remove Empty Lines — Delete blank lines online',
		description:
			'Remove blank and whitespace-only lines from text. See how many lines were removed. Free online empty line remover.',
		keywords: ['remove empty lines', 'delete blank lines', 'strip empty lines', 'clean text'],
		related: ['trim-lines', 'whitespace-cleaner', 'duplicate-line-remover'],
		faq: [
			{
				question: 'What counts as an empty line?',
				answer:
					'Lines that are completely blank or contain only spaces and tabs are removed. Lines with visible text are kept.'
			},
			{
				question: 'Does my text leave my device?',
				answer: 'No. Processing runs entirely in your browser.'
			},
			{
				question: 'Are trailing newlines preserved?',
				answer:
					'The result joins non-empty lines with single newlines. A trailing blank line at the end is removed if it was empty.'
			}
		],
		howTo: [
			'Paste your text (one block or list)',
			'Review how many empty lines were removed',
			'Copy the cleaned result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
