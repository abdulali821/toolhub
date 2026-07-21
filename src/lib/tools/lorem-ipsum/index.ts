import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

const WORDS = [
	'lorem',
	'ipsum',
	'dolor',
	'sit',
	'amet',
	'consectetur',
	'adipiscing',
	'elit',
	'sed',
	'do',
	'eiusmod',
	'tempor',
	'incididunt',
	'ut',
	'labore',
	'et',
	'dolore',
	'magna',
	'aliqua',
	'enim',
	'ad',
	'minim',
	'veniam',
	'quis',
	'nostrud',
	'exercitation',
	'ullamco',
	'laboris',
	'nisi',
	'aliquip',
	'ex',
	'ea',
	'commodo',
	'consequat'
];

export const inputSchema = v.object({
	paragraphs: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(20)),
	wordsPerParagraph: v.pipe(v.number(), v.integer(), v.minValue(10), v.maxValue(120))
});

export type LoremInput = v.InferOutput<typeof inputSchema>;
export type LoremOutput = { text: string };

function paragraph(wordCount: number, startWithLorem: boolean) {
	const parts: string[] = [];
	if (startWithLorem) {
		parts.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet');
	}
	while (parts.length < wordCount) {
		parts.push(WORDS[Math.floor(Math.random() * WORDS.length)]!);
	}
	const sentence = parts.join(' ');
	return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

export function run(input: LoremInput): LoremOutput {
	const blocks = Array.from({ length: input.paragraphs }, (_, i) =>
		paragraph(input.wordsPerParagraph, i === 0)
	);
	return { text: blocks.join('\n\n') };
}

export const loremIpsum: ToolDefinition<LoremInput, LoremOutput> = {
	id: 'lorem-ipsum',
	version: '1.0.0',
	category: 'generators',
	mode: 'instant',
	status: 'stable',
	tags: ['lorem', 'placeholder', 'text', 'generator'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['paragraphs', 'wordsPerParagraph']
	},
	presets: [
		{
			id: 'short',
			label: 'Short',
			params: { paragraphs: '1', wordsPerParagraph: '20' }
		},
		{
			id: 'default',
			label: 'Default',
			params: { paragraphs: '2', wordsPerParagraph: '40' }
		},
		{
			id: 'long',
			label: 'Long',
			params: { paragraphs: '5', wordsPerParagraph: '80' }
		}
	],
	workflow: {
		next: ['word-counter', 'markdown-preview']
	},
	metadata: {
		name: 'Lorem Ipsum',
		title: 'Lorem Ipsum Generator — Placeholder text',
		description: 'Generate classic Lorem Ipsum placeholder paragraphs for mockups and drafts.',
		keywords: ['lorem ipsum', 'placeholder text', 'dummy text'],
		related: ['word-counter', 'password-generator'],
		faq: [
			{
				question: 'Is the text random?',
				answer: 'Yes. Words are chosen randomly from a classic Lorem vocabulary.'
			},
			{
				question: 'Can I control the length?',
				answer: 'Yes. Set the number of paragraphs and words per paragraph before generating.'
			},
			{
				question: 'Can I download the text?',
				answer: 'Yes. Use Download in the toolbar to save the output as a plain-text file.'
			}
		],
		howTo: [
			'Set paragraphs and word count',
			'Click Generate',
			'Copy or download the placeholder text'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
