import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['collapse', 'normalize-newlines', 'strip-all', 'tabs-to-spaces'])
});

export type WhitespaceCleanerInput = v.InferOutput<typeof inputSchema>;
export type WhitespaceCleanerOutput = { result: string };

export function run(input: WhitespaceCleanerInput): WhitespaceCleanerOutput {
	let result = input.text;

	switch (input.mode) {
		case 'collapse':
			result = result
				.replace(/\r\n/g, '\n')
				.split('\n')
				.map((line) => line.replace(/ +/g, ' '))
				.join('\n');
			break;
		case 'normalize-newlines':
			result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
			break;
		case 'strip-all':
			result = result.replace(/\s+/g, '');
			break;
		case 'tabs-to-spaces':
			result = result.replace(/\t/g, '    ');
			break;
	}

	return { result };
}

const SAMPLE_TEXT = 'hello   world\r\n\tindented\tline';

export const whitespaceCleaner: ToolDefinition<WhitespaceCleanerInput, WhitespaceCleanerOutput> = {
	id: 'whitespace-cleaner',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'whitespace', 'clean', 'normalize'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'mode'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'collapse',
			label: 'Collapse spaces',
			params: { text: 'hello   world   toolhub', mode: 'collapse' }
		},
		{
			id: 'newlines',
			label: 'Normalize newlines',
			params: { text: 'line1\r\nline2\rline3', mode: 'normalize-newlines' }
		},
		{
			id: 'tabs',
			label: 'Tabs to spaces',
			params: { text: SAMPLE_TEXT, mode: 'tabs-to-spaces' }
		}
	],
	workflow: {
		next: ['trim-lines', 'remove-empty-lines', 'find-replace']
	},
	metadata: {
		name: 'Whitespace Cleaner',
		title: 'Whitespace Cleaner — Collapse spaces, normalize newlines, strip whitespace',
		description:
			'Clean whitespace: collapse multiple spaces, normalize line endings, convert tabs to spaces, or strip all whitespace. Free online whitespace tool.',
		keywords: [
			'whitespace cleaner',
			'collapse spaces',
			'normalize newlines',
			'tabs to spaces',
			'strip whitespace'
		],
		related: ['trim-lines', 'remove-empty-lines', 'find-replace'],
		faq: [
			{
				question: 'What does Collapse spaces do?',
				answer:
					'Within each line, consecutive space characters are replaced with a single space. Line breaks are preserved.'
			},
			{
				question: 'What does Strip all whitespace do?',
				answer:
					'Removes every whitespace character including spaces, tabs, and newlines. The result is one continuous string.'
			},
			{
				question: 'How many spaces replace a tab?',
				answer: 'Each tab character is replaced with four spaces.'
			}
		],
		howTo: ['Paste your text', 'Pick a cleaning mode', 'Copy the cleaned result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
