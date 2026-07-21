import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	prefix: v.string(),
	suffix: v.string(),
	skipEmpty: v.boolean()
});

export type AddPrefixSuffixInput = v.InferOutput<typeof inputSchema>;
export type AddPrefixSuffixOutput = { result: string };

export function run(input: AddPrefixSuffixInput): AddPrefixSuffixOutput {
	const lines = input.text.replace(/\r\n/g, '\n').split('\n');
	const result = lines
		.map((line) => {
			if (input.skipEmpty && line.trim() === '') return line;
			return `${input.prefix}${line}${input.suffix}`;
		})
		.join('\n');

	return { result };
}

const SAMPLE_TEXT = 'alpha\n\nbeta\ngamma';

export const addPrefixSuffix: ToolDefinition<AddPrefixSuffixInput, AddPrefixSuffixOutput> = {
	id: 'add-prefix-suffix',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'prefix', 'suffix', 'lines'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'prefix', 'suffix', 'skipEmpty'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'quote',
			label: 'Wrap in quotes',
			params: { text: SAMPLE_TEXT, prefix: '"', suffix: '"', skipEmpty: 'true' }
		},
		{
			id: 'bullet',
			label: 'Bullet list',
			params: { text: SAMPLE_TEXT, prefix: '- ', suffix: '', skipEmpty: 'true' }
		},
		{
			id: 'sql-in',
			label: 'SQL IN values',
			params: {
				text: 'apple\nbanana\ncherry',
				prefix: "'",
				suffix: "',",
				skipEmpty: 'false'
			}
		}
	],
	workflow: {
		next: ['trim-lines', 'find-replace', 'slugify']
	},
	metadata: {
		name: 'Add Prefix/Suffix',
		title: 'Add Prefix/Suffix — Add text to each line online',
		description:
			'Add a prefix and/or suffix to every line. Optionally skip empty lines. Handy for bullets, quotes, SQL lists, and bulk formatting.',
		keywords: ['add prefix', 'add suffix', 'prefix each line', 'wrap lines', 'bullet list'],
		related: ['trim-lines', 'find-replace', 'slugify'],
		faq: [
			{
				question: 'What does Skip empty lines do?',
				answer:
					'When enabled, blank or whitespace-only lines are left unchanged. When disabled, prefix and suffix are applied to every line including empty ones.'
			},
			{
				question: 'Can I use only a prefix or only a suffix?',
				answer: 'Yes. Leave the other field blank to add text on just one side of each line.'
			},
			{
				question: 'Does my data leave my device?',
				answer: 'No. Everything runs locally in your browser.'
			}
		],
		howTo: [
			'Paste one item per line',
			'Enter prefix and/or suffix (optionally skip empty lines)',
			'Copy the formatted result'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['skipEmpty'] }
};
