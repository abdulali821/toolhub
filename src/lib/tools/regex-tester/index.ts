import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	pattern: v.string(),
	flags: v.optional(v.string(), 'g'),
	text: v.string()
});

export type RegexTesterInput = v.InferOutput<typeof inputSchema>;
export type RegexMatch = { match: string; index: number; groups: string[] };
export type RegexTesterOutput = {
	matches: RegexMatch[];
	error?: string;
	count: number;
};

export function run(input: RegexTesterInput): RegexTesterOutput {
	try {
		const flags = (input.flags || 'g').replace(/[^gimsuy]/g, '');
		const safeFlags = flags.includes('g') ? flags : `${flags}g`;
		const regex = new RegExp(input.pattern, safeFlags);
		const matches: RegexMatch[] = [];
		let result: RegExpExecArray | null;
		let guard = 0;
		while ((result = regex.exec(input.text)) !== null) {
			matches.push({
				match: result[0],
				index: result.index,
				groups: result.slice(1)
			});
			if (result[0] === '') regex.lastIndex += 1;
			guard += 1;
			if (guard > 5000) break;
		}
		return { matches, count: matches.length };
	} catch (err) {
		return {
			matches: [],
			count: 0,
			error: err instanceof Error ? err.message : 'Invalid regular expression'
		};
	}
}

export const regexTester: ToolDefinition<RegexTesterInput, RegexTesterOutput> = {
	id: 'regex-tester',
	version: '1.0.0',
	category: 'developer',
	mode: 'instant',
	status: 'stable',
	tags: ['regex', 'regexp', 'pattern', 'dev'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['pattern', 'flags', 'text'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'words',
			label: 'Capitalized words',
			params: {
				pattern: '\\b[A-Z][a-z]+\\b',
				flags: 'g',
				text: 'Hello HeyTools from Ada and Grace.'
			}
		},
		{
			id: 'email',
			label: 'Email addresses',
			params: {
				pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+',
				flags: 'g',
				text: 'Contact ada@example.com or grace@example.com for details.'
			}
		},
		{
			id: 'digits',
			label: 'Digits',
			params: {
				pattern: '\\d+',
				flags: 'g',
				text: 'Order 42 shipped on 2024-01-15 at 09:30.'
			}
		}
	],
	workflow: {
		next: ['text-diff', 'json-formatter']
	},
	metadata: {
		name: 'Regex Tester',
		title: 'Regex Tester — Test JavaScript regular expressions',
		description:
			'Try a pattern against sample text and inspect matches, indexes, and capture groups instantly. Uses JavaScript RegExp in your browser—nothing is uploaded.',
		keywords: [
			'regex tester',
			'regular expression',
			'regexp test',
			'javascript regex',
			'regex match'
		],
		related: ['json-formatter', 'text-diff', 'jwt-decoder'],
		faq: [
			{
				question: 'Which regex flavor is used?',
				answer:
					'JavaScript RegExp, including flags such as g, i, m, s, u, and y. Patterns that work in other engines (PCRE, .NET) may differ slightly.'
			},
			{
				question: 'Is my pattern or sample text uploaded?',
				answer:
					'No. Matching runs locally. Share links can embed short pattern/text in the URL if you choose to share—avoid putting secrets into shared links.'
			},
			{
				question: 'Why do empty matches stop early?',
				answer:
					'Zero-length matches advance the lastIndex to avoid infinite loops. Results are also capped so runaway patterns stay responsive in the browser.'
			}
		],
		howTo: [
			'Enter a pattern and optional flags',
			'Paste sample text to test against',
			'Review matches and capture groups'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run' }
};
