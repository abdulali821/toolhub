import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	text: v.string(),
	mode: v.picklist(['encode', 'decode'])
});

export type HtmlCodecInput = v.InferOutput<typeof inputSchema>;
export type HtmlCodecOutput = { result: string };

const DEFAULT_TEXT = '<div class="hello">ToolHub & friends</div>';
const SAMPLE_ENCODED = '&lt;div class=&quot;hello&quot;&gt;ToolHub &amp; friends&lt;/div&gt;';

const ENTITIES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

export function run(input: HtmlCodecInput): HtmlCodecOutput {
	if (input.mode === 'encode') {
		return {
			result: input.text.replace(/[&<>"']/g, (ch) => ENTITIES[ch] ?? ch)
		};
	}

	const textarea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
	if (textarea) {
		textarea.innerHTML = input.text;
		return { result: textarea.value };
	}

	// SSR / Node fallback
	return {
		result: input.text
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&amp;/g, '&')
	};
}

export const htmlCodec: ToolDefinition<HtmlCodecInput, HtmlCodecOutput> = {
	id: 'html-codec',
	version: '1.0.0',
	category: 'encoders',
	mode: 'instant',
	status: 'stable',
	tags: ['html', 'encode', 'decode', 'entities'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['text', 'mode']
	},
	presets: [
		{
			id: 'encode',
			label: 'Encode sample',
			params: { mode: 'encode', text: DEFAULT_TEXT }
		},
		{
			id: 'decode',
			label: 'Decode sample',
			params: { mode: 'decode', text: SAMPLE_ENCODED }
		}
	],
	workflow: {
		next: ['unicode-escape', 'hex-codec', 'url-codec', 'markdown-preview']
	},
	metadata: {
		name: 'HTML Encoder / Decoder',
		title: 'HTML Encoder / Decoder — Escape and unescape entities',
		description:
			'Escape special characters to HTML entities or decode entities back to plain text. Useful when embedding snippets safely in markup—runs in your browser.',
		keywords: ['html encode', 'html decode', 'html entities', 'escape html', 'unescape html'],
		related: ['unicode-escape', 'hex-codec', 'url-codec', 'base64-codec'],
		faq: [
			{
				question: 'Which characters are encoded?',
				answer:
					'Encode mode escapes &, <, >, ", and \' so you can embed text safely inside HTML without breaking markup.'
			},
			{
				question: 'When should I encode vs use Markdown Preview?',
				answer:
					'Use this when you need raw entity escaping for templates or CMS fields. Use Markdown Preview when you want rendered HTML from Markdown source.'
			},
			{
				question: 'Does my HTML leave the device?',
				answer: 'No. Encoding and decoding run locally in your browser.'
			}
		],
		howTo: ['Paste your text or entity string', 'Choose Encode or Decode', 'Copy the result']
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte') },
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
