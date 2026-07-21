import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	side: v.picklist(['both', 'start', 'end'])
});

export type TrimLinesInput = v.InferOutput<typeof inputSchema>;
export type TrimLinesOutput = { result: string };

function trimLine(line: string, side: TrimLinesInput['side']): string {
	switch (side) {
		case 'start':
			return line.trimStart();
		case 'end':
			return line.trimEnd();
		default:
			return line.trim();
	}
}

export function run(input: TrimLinesInput): TrimLinesOutput {
	const lines = input.text.replace(/\r\n/g, '\n').split('\n');
	return {
		result: lines.map((line) => trimLine(line, input.side)).join('\n')
	};
}

const SAMPLE_TEXT = '  alpha  \n\tbeta\t\n  gamma';

export const trimLines: ToolDefinition<TrimLinesInput, TrimLinesOutput> = {
	id: 'trim-lines',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'trim', 'whitespace', 'lines'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'side'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'both',
			label: 'Trim both sides',
			params: { text: SAMPLE_TEXT, side: 'both' }
		},
		{
			id: 'start',
			label: 'Leading only',
			params: { text: SAMPLE_TEXT, side: 'start' }
		},
		{
			id: 'end',
			label: 'Trailing only',
			params: { text: SAMPLE_TEXT, side: 'end' }
		}
	],
	workflow: {
		next: ['remove-empty-lines', 'whitespace-cleaner', 'add-prefix-suffix']
	},
	metadata: {
		name: 'Trim Lines',
		title: 'Trim Lines — Remove leading or trailing whitespace per line',
		description:
			'Trim leading, trailing, or both sides of whitespace on every line. Free online line trimmer for lists, code, and pasted text.',
		keywords: ['trim lines', 'strip whitespace', 'leading spaces', 'trailing spaces'],
		related: ['remove-empty-lines', 'whitespace-cleaner', 'add-prefix-suffix'],
		faq: [
			{
				question: 'What is trimmed?',
				answer:
					'Spaces, tabs, and other Unicode whitespace at the start and/or end of each line, depending on the side option.'
			},
			{
				question: 'Does trimming affect blank lines?',
				answer:
					'Blank or whitespace-only lines become empty lines after “both” trimming. Use Remove Empty Lines to delete them afterward.'
			},
			{
				question: 'Is my text uploaded?',
				answer: 'No. Trimming runs locally in your browser.'
			}
		],
		howTo: ['Paste your text', 'Choose trim side: both, start, or end', 'Copy the trimmed result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['side'] }
};
