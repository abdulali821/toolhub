import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';
import { run as mdRun } from '../markdown-preview';

export const inputSchema = v.object({
	markdown: v.string()
});

export type MarkdownToHtmlInput = v.InferOutput<typeof inputSchema>;
export type MarkdownToHtmlOutput = { html: string };

/** Reuses the lightweight Markdown subset from markdown-preview for consistent output. */
export function run(input: MarkdownToHtmlInput): MarkdownToHtmlOutput {
	return { html: mdRun({ markdown: input.markdown }).html };
}

const DEFAULT_MARKDOWN = `# HeyTools

Convert **Markdown** to clean, copyable HTML.

- Fast
- Private
- Free

\`inline code\` and [links](https://example.com) work too.
`;

export const markdownToHtml: ToolDefinition<MarkdownToHtmlInput, MarkdownToHtmlOutput> = {
	id: 'markdown-to-html',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['markdown', 'html', 'convert'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	share: {
		params: ['markdown'],
		maxParamBytes: 4000
	},
	presets: [
		{ id: 'intro', label: 'Intro sample', params: { markdown: DEFAULT_MARKDOWN } },
		{
			id: 'readme',
			label: 'README snippet',
			params: {
				markdown: `# Project Name

## Install

\`\`\`
npm install
\`\`\`

## Usage

Run \`npm start\` and open the app.
`
			}
		}
	],
	workflow: {
		next: ['html-codec', 'markdown-preview']
	},
	metadata: {
		name: 'Markdown to HTML',
		title: 'Markdown to HTML — Convert Markdown to HTML online',
		description:
			'Convert Markdown to clean HTML instantly. Supports headings, lists, links, code fences, and emphasis—copy or download the generated HTML, all locally in your browser.',
		keywords: ['markdown to html', 'md to html converter', 'markdown converter', 'html generator'],
		related: ['markdown-preview', 'html-codec'],
		faq: [
			{
				question: 'How is this different from Markdown Preview?',
				answer:
					'Markdown Preview renders a live HTML preview as you type. Markdown to HTML uses the same conversion but is built for grabbing the raw HTML output—to copy or download it.'
			},
			{
				question: 'Is this full CommonMark?',
				answer:
					'It covers a practical subset—headings, lists, code fences, links, bold/italic—for quick conversions, not every edge case of a full parser.'
			},
			{
				question: 'Does my Markdown leave the browser?',
				answer:
					'No. Conversion runs locally. Share links may include short content in the URL if you choose to share.'
			}
		],
		howTo: [
			'Paste or write Markdown on the left',
			'View the generated HTML on the right',
			'Copy or download the HTML output'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte'), layout: 'split' },
	analytics: { eventName: 'tool_run' }
};
