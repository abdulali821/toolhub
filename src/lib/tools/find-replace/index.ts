import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	find: v.string(),
	replace: v.string(),
	ignoreCase: v.boolean()
});

export type FindReplaceInput = v.InferOutput<typeof inputSchema>;
export type FindReplaceOutput = { result: string; replacements: number };

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function run(input: FindReplaceInput): FindReplaceOutput {
	if (!input.find) {
		return { result: input.text, replacements: 0 };
	}

	const flags = input.ignoreCase ? 'gi' : 'g';
	const pattern = new RegExp(escapeRegExp(input.find), flags);
	const matches = input.text.match(pattern);
	const replacements = matches?.length ?? 0;
	const result = input.text.replace(pattern, input.replace);

	return { result, replacements };
}

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog. The fox is quick.';

export const findReplace: ToolDefinition<FindReplaceInput, FindReplaceOutput> = {
	id: 'find-replace',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'find', 'replace', 'search'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'find', 'replace', 'ignoreCase'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'fox-cat',
			label: 'fox → cat',
			params: {
				text: SAMPLE_TEXT,
				find: 'fox',
				replace: 'cat',
				ignoreCase: 'false'
			}
		},
		{
			id: 'case-insensitive',
			label: 'Case-insensitive The',
			params: {
				text: SAMPLE_TEXT,
				find: 'the',
				replace: 'a',
				ignoreCase: 'true'
			}
		},
		{
			id: 'spaces',
			label: 'Collapse spaces',
			params: {
				text: 'hello   world   heytools',
				find: '  ',
				replace: ' ',
				ignoreCase: 'false'
			}
		}
	],
	workflow: {
		next: ['word-counter', 'case-converter', 'add-prefix-suffix']
	},
	metadata: {
		name: 'Find and Replace',
		title: 'Find and Replace — Search and replace text online',
		description:
			'Find and replace plain text instantly in your browser. Optional case-insensitive matching. Free online find and replace tool.',
		keywords: ['find and replace', 'search replace', 'text replace', 'bulk replace'],
		related: ['word-counter', 'case-converter', 'text-diff'],
		faq: [
			{
				question: 'Is this regex find and replace?',
				answer:
					'No. Matching is plain text only. Special characters in your find string are treated literally.'
			},
			{
				question: 'Does my text leave my device?',
				answer: 'No. Find and replace runs entirely in your browser. Nothing is uploaded.'
			},
			{
				question: 'Can I ignore letter case?',
				answer: 'Yes. Enable “Ignore case” to match regardless of capitalization.'
			}
		],
		howTo: [
			'Paste or type your text',
			'Enter the find and replace strings (optionally ignore case)',
			'Copy the result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['ignoreCase'] }
};
