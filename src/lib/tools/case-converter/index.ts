import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['upper', 'lower', 'title', 'sentence', 'camel', 'pascal', 'snake', 'kebab'])
});

export type CaseConverterInput = v.InferOutput<typeof inputSchema>;
export type CaseConverterOutput = { result: string };

function words(text: string) {
	return text
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[^a-zA-Z0-9]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean);
}

export function run(input: CaseConverterInput): CaseConverterOutput {
	const list = words(input.text);
	let result = input.text;

	switch (input.mode) {
		case 'upper':
			result = input.text.toUpperCase();
			break;
		case 'lower':
			result = input.text.toLowerCase();
			break;
		case 'title':
			result = list.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
			break;
		case 'sentence':
			result = input.text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (m) => m.toUpperCase());
			break;
		case 'camel':
			result = list
				.map((w, i) =>
					i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
				)
				.join('');
			break;
		case 'pascal':
			result = list.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
			break;
		case 'snake':
			result = list.map((w) => w.toLowerCase()).join('_');
			break;
		case 'kebab':
			result = list.map((w) => w.toLowerCase()).join('-');
			break;
	}

	return { result };
}

const SAMPLE_TEXT = 'Hello HeyTools World';

export const caseConverter: ToolDefinition<CaseConverterInput, CaseConverterOutput> = {
	id: 'case-converter',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'case', 'camelCase', 'snake_case'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'mode']
	},
	presets: [
		{
			id: 'title',
			label: 'Title Case',
			params: { text: SAMPLE_TEXT, mode: 'title' }
		},
		{
			id: 'camel',
			label: 'camelCase',
			params: { text: SAMPLE_TEXT, mode: 'camel' }
		},
		{
			id: 'snake',
			label: 'snake_case',
			params: { text: SAMPLE_TEXT, mode: 'snake' }
		}
	],
	workflow: {
		next: ['slugify', 'word-counter']
	},
	metadata: {
		name: 'Case Converter',
		title: 'Case Converter — UPPER, lower, camelCase, snake_case, kebab-case',
		description:
			'Convert text between uppercase, lowercase, title case, sentence case, camelCase, PascalCase, snake_case, and kebab-case. Handy for renaming variables, headings, and API fields—all in your browser.',
		keywords: [
			'case converter',
			'camelCase converter',
			'snake_case',
			'title case',
			'kebab-case',
			'PascalCase'
		],
		related: ['slugify', 'word-counter'],
		faq: [
			{
				question: 'Does conversion leave my device?',
				answer: 'No. Everything runs locally in your browser. Nothing is sent to a server.'
			},
			{
				question: 'What is the difference between camelCase and PascalCase?',
				answer:
					'camelCase starts with a lowercase letter (userName); PascalCase capitalizes every word segment (UserName). Both drop spaces and separators.'
			},
			{
				question: 'When should I use snake_case vs kebab-case?',
				answer:
					'snake_case (user_name) is common in databases and Python; kebab-case (user-name) is typical for URLs, CSS classes, and slugs. Use Slugify if you only need URL-safe kebab output.'
			}
		],
		howTo: ['Paste your text', 'Pick a case mode', 'Copy the converted result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
