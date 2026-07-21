import type { ToolDefinition } from '$engine/types';
import { escapeUnicode, unescapeUnicode } from '$lib/utils/encoding';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['escape', 'unescape'])
});

export type UnicodeEscapeInput = v.InferOutput<typeof inputSchema>;
export type UnicodeEscapeOutput = { result: string; error?: string };

const DEFAULT_TEXT = 'café ☕';
const SAMPLE_ESCAPED = 'caf\\u00e9 \\u2615';

export function run(input: UnicodeEscapeInput): UnicodeEscapeOutput {
	try {
		if (input.mode === 'escape') {
			return { result: escapeUnicode(input.text) };
		}
		return { result: unescapeUnicode(input.text) };
	} catch (err) {
		return {
			result: '',
			error: err instanceof Error ? err.message : 'Invalid escape sequence'
		};
	}
}

export const unicodeEscape: ToolDefinition<UnicodeEscapeInput, UnicodeEscapeOutput> = {
	id: 'unicode-escape',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['unicode', 'escape', 'unescape', 'javascript'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'mode']
	},
	presets: [
		{
			id: 'escape',
			label: 'Escape sample',
			params: { mode: 'escape', text: DEFAULT_TEXT }
		},
		{
			id: 'unescape',
			label: 'Unescape sample',
			params: { mode: 'unescape', text: SAMPLE_ESCAPED }
		}
	],
	workflow: {
		next: ['hex-codec', 'html-codec', 'ascii-converter']
	},
	metadata: {
		name: 'Unicode Escape / Unescape',
		title: 'Unicode Escape / Unescape — \\u sequences for JavaScript',
		description:
			'Escape non-ASCII characters to JavaScript \\u sequences or unescape them back to readable text. Handles BMP and surrogate pairs—runs in your browser.',
		keywords: ['unicode escape', 'unicode unescape', '\\u escape', 'javascript unicode'],
		related: ['hex-codec', 'html-codec', 'ascii-converter'],
		faq: [
			{
				question: 'Which escape formats are supported?',
				answer:
					'Escape outputs \\uXXXX for BMP characters and surrogate pairs for astral code points. Unescape also accepts \\x, \\u{…}, and CSS-style escapes.'
			},
			{
				question: 'When should I use HTML encode instead?',
				answer:
					'Use HTML Encoder for entity-safe markup (&amp;, &lt;). Use this tool for JavaScript string literals and source code.'
			},
			{
				question: 'Is my text uploaded?',
				answer: 'No. Escaping runs entirely on your device.'
			}
		],
		howTo: ['Paste text or escaped string', 'Choose Escape or Unescape', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
