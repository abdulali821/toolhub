import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	left: v.string(),
	right: v.string()
});

export type TextDiffInput = v.InferOutput<typeof inputSchema>;
export type DiffLine = { type: 'same' | 'add' | 'remove'; text: string };
export type TextDiffOutput = { lines: DiffLine[]; summary: string };

export function run(input: TextDiffInput): TextDiffOutput {
	const a = input.left.replace(/\r\n/g, '\n').split('\n');
	const b = input.right.replace(/\r\n/g, '\n').split('\n');
	const lines: DiffLine[] = [];
	let i = 0;
	let j = 0;
	let added = 0;
	let removed = 0;

	while (i < a.length || j < b.length) {
		if (i < a.length && j < b.length && a[i] === b[j]) {
			lines.push({ type: 'same', text: a[i]! });
			i += 1;
			j += 1;
			continue;
		}

		const lookAhead = 20;
		let matched = false;
		for (let d = 1; d <= lookAhead && !matched; d++) {
			if (i + d < a.length && j < b.length && a[i + d] === b[j]) {
				for (let k = 0; k < d; k++) {
					lines.push({ type: 'remove', text: a[i + k]! });
					removed += 1;
				}
				i += d;
				matched = true;
			} else if (j + d < b.length && i < a.length && a[i] === b[j + d]) {
				for (let k = 0; k < d; k++) {
					lines.push({ type: 'add', text: b[j + k]! });
					added += 1;
				}
				j += d;
				matched = true;
			}
		}

		if (!matched) {
			if (i < a.length) {
				lines.push({ type: 'remove', text: a[i]! });
				removed += 1;
				i += 1;
			}
			if (j < b.length) {
				lines.push({ type: 'add', text: b[j]! });
				added += 1;
				j += 1;
			}
		}
	}

	return {
		lines,
		summary: `${added} added, ${removed} removed`
	};
}

const DEFAULT_LEFT = 'hello\nworld\nfoo';
const DEFAULT_RIGHT = 'hello\nHeyTools\nfoo\nbar';

export const textDiff: ToolDefinition<TextDiffInput, TextDiffOutput> = {
	id: 'text-diff',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['diff', 'compare', 'text', 'changes'],
	capabilities: ['copy', 'share', 'reset', 'favorite'],
	share: {
		params: ['left', 'right'],
		maxParamBytes: 4000
	},
	presets: [
		{
			id: 'demo',
			label: 'Demo diff',
			params: { left: DEFAULT_LEFT, right: DEFAULT_RIGHT }
		},
		{
			id: 'identical',
			label: 'Identical lines',
			params: { left: 'same line\nanother line', right: 'same line\nanother line' }
		},
		{
			id: 'rewrite',
			label: 'Paragraph rewrite',
			params: {
				left: 'The quick brown fox jumps over the lazy dog.',
				right: 'A quick brown fox leaps over a sleepy dog.'
			}
		}
	],
	workflow: {
		next: ['word-counter', 'json-formatter']
	},
	metadata: {
		name: 'Text Diff',
		title: 'Text Diff — Compare two texts line by line',
		description:
			'Paste two versions of a document, config, or code snippet and see added and removed lines at a glance. A simple line-oriented diff that stays in your browser.',
		keywords: ['text diff', 'diff checker', 'compare text', 'line difference', 'text compare'],
		related: ['word-counter', 'case-converter', 'json-formatter'],
		faq: [
			{
				question: 'Is my text uploaded?',
				answer:
					'No. Diffing runs entirely in your browser—useful for drafts, configs, or snippets you would rather not send to a remote service.'
			},
			{
				question: 'Is this a full Git-style diff?',
				answer:
					'It is a practical line-by-line comparison with a short look-ahead for reordered blocks—not a full Myers/Git patch engine. Ideal for quick checks, not patch generation.'
			},
			{
				question: 'What does the summary mean?',
				answer:
					'The summary counts lines marked added vs removed so you can see the size of the change before reading every highlight.'
			}
		],
		howTo: [
			'Paste the original text on the left',
			'Paste the revised text on the right',
			'Review added/removed lines and the summary'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte'), layout: 'split' },
	analytics: { eventName: 'tool_run' }
};
