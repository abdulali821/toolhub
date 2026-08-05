import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	wpm: v.pipe(v.number(), v.integer(), v.minValue(100), v.maxValue(400))
});

export type ReadingTimeEstimatorInput = v.InferOutput<typeof inputSchema>;
export type ReadingTimeEstimatorOutput = {
	words: number;
	characters: number;
	seconds: number;
	minutes: number;
	formatted: string;
};

export function run(input: ReadingTimeEstimatorInput): ReadingTimeEstimatorOutput {
	const text = input.text;
	const wpm = input.wpm;
	const words = text.trim() ? text.trim().split(/\s+/).length : 0;
	const characters = text.length;

	const minutesExact = wpm > 0 ? words / wpm : 0;
	const seconds = Math.round(minutesExact * 60);
	const minutes = words === 0 ? 0 : Math.ceil(minutesExact);

	const formatted = `${minutes} min read`;

	return { words, characters, seconds, minutes, formatted };
}

const SAMPLE_TEXT =
	'HeyTools estimates reading time entirely in your browser. Paste an article, blog post, or draft to see how long it takes an average reader to get through it, based on words per minute.';

export const readingTimeEstimator: ToolDefinition<
	ReadingTimeEstimatorInput,
	ReadingTimeEstimatorOutput
> = {
	id: 'reading-time-estimator',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['reading', 'time', 'words', 'estimator'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['wpm', 'text'],
		maxParamBytes: 4000
	},
	presets: [
		{ id: 'sample', label: 'Sample article', params: { text: SAMPLE_TEXT, wpm: '200' } },
		{ id: 'slow-reader', label: 'Slow reader (100 wpm)', params: { wpm: '100' } },
		{ id: 'fast-reader', label: 'Fast reader (300 wpm)', params: { wpm: '300' } }
	],
	workflow: {
		next: ['word-counter', 'lorem-ipsum']
	},
	metadata: {
		name: 'Reading Time Estimator',
		title: 'Reading Time Estimator — Estimate minutes to read',
		description:
			'Estimate how long it takes to read an article, blog post, or document based on word count and reading speed (words per minute). Runs entirely in your browser.',
		keywords: [
			'reading time estimator',
			'reading time calculator',
			'minutes to read',
			'words per minute',
			'estimated reading time'
		],
		related: ['word-counter', 'lorem-ipsum'],
		faq: [
			{
				question: 'How is reading time calculated?',
				answer:
					'Reading time is the word count divided by your chosen reading speed (words per minute), rounded up to the nearest minute so short pieces still show at least 1 minute.'
			},
			{
				question: 'What reading speed should I use?',
				answer:
					'200 words per minute is a common average for adult silent reading. Slower readers or dense technical content may be closer to 100–150 wpm; fast readers can exceed 300 wpm.'
			},
			{
				question: 'Does my text leave my device?',
				answer:
					'No. Estimation runs locally in your browser. Share links only include your reading speed by default, and can optionally include short text.'
			}
		],
		howTo: [
			'Paste or type your text',
			'Adjust words-per-minute to match your audience',
			'Read the estimated minutes and word/character counts'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['wpm'] }
};
