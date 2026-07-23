import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string()
});

export type WordCounterInput = v.InferOutput<typeof inputSchema>;
export type WordCounterOutput = {
	characters: number;
	charactersNoSpaces: number;
	words: number;
	lines: number;
	sentences: number;
};

export function run(input: WordCounterInput): WordCounterOutput {
	const text = input.text;
	const words = text.trim() ? text.trim().split(/\s+/).length : 0;
	const lines = text.length ? text.split(/\r\n|\r|\n/).length : 0;
	const sentences = text.trim()
		? (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter((s) => s.trim()).length
		: 0;

	return {
		characters: text.length,
		charactersNoSpaces: text.replace(/\s/g, '').length,
		words,
		lines,
		sentences
	};
}

const SAMPLE_PARAGRAPH =
	'HeyTools runs every utility in your browser. Paste text here to count words, characters, lines, and sentences without uploading anything.';

export const wordCounter: ToolDefinition<WordCounterInput, WordCounterOutput> = {
	id: 'word-counter',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['text', 'words', 'count', 'characters'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['text'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'sample',
			label: 'Sample paragraph',
			params: { text: SAMPLE_PARAGRAPH }
		},
		{
			id: 'clear',
			label: 'Clear',
			params: { text: '' }
		}
	],
	workflow: {
		next: ['case-converter', 'slugify', 'lorem-ipsum']
	},
	metadata: {
		name: 'Word Counter',
		title: 'Word Counter — Words, characters, lines, and sentences',
		description:
			'Paste any text to count words, characters (with and without spaces), lines, and sentences instantly. Runs fully in your browser—nothing is uploaded.',
		keywords: [
			'word counter',
			'character count',
			'line count',
			'sentence counter',
			'word count tool'
		],
		related: ['case-converter', 'slugify', 'lorem-ipsum'],
		faq: [
			{
				question: 'Is my text uploaded?',
				answer:
					'No. Counting runs entirely in your browser. Your draft, essay, or notes never leave your device.'
			},
			{
				question: 'How are words counted?',
				answer:
					'Words are split on whitespace after trimming. Empty input counts as zero words; consecutive spaces do not inflate the total.'
			},
			{
				question: 'When should I use character count without spaces?',
				answer:
					'Use it for limits that ignore whitespace (some SMS, SEO, or form constraints). The with-spaces count matches typical editor length limits.'
			}
		],
		howTo: [
			'Paste or type your text',
			'Review live word and character totals',
			'Copy stats or clear and start again'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
