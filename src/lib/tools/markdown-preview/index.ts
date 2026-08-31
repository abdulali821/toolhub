import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';
import { MARKDOWN_FILE_CONSTRAINTS, markdownToHtml } from '$lib/utils/markdown';

export { MARKDOWN_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	markdown: v.string()
});

export type MarkdownPreviewInput = v.InferOutput<typeof inputSchema>;
export type MarkdownPreviewOutput = { html: string };

export function run(input: MarkdownPreviewInput): MarkdownPreviewOutput {
	return { html: markdownToHtml(input.markdown) };
}

const DEFAULT_MARKDOWN = `# HeyTools

Write **Markdown** on the left.

- Fast
- Private
- Free

\`inline code\` and [links](https://example.com) work too.

\`\`\`
code fence
\`\`\`
`;

export const markdownPreview: ToolDefinition<MarkdownPreviewInput, MarkdownPreviewOutput> = {
	id: 'markdown-preview',
	version: '1.0.0',
	category: 'text',
	mode: 'instant',
	status: 'stable',
	tags: ['markdown', 'preview', 'md', 'text'],
	capabilities: ['copy', 'download', 'share', 'reset', 'favorite'],
	file: MARKDOWN_FILE_CONSTRAINTS,
	// Markdown is not synced into the URL (too large). Presets still set
	// `?markdown=` once; the UI applies it and immediately strips the param.
	share: {
		params: ['markdown']
	},
	presets: [
		{
			id: 'intro',
			label: 'Intro sample',
			params: { markdown: DEFAULT_MARKDOWN }
		},
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
		},
		{
			id: 'flowchart',
			label: 'Mermaid flowchart',
			params: {
				markdown: `# Flow example

\`\`\`mermaid
flowchart LR
  A[Start] --> B{Decision}
  B -->|Yes| C[Done]
  B -->|No| D[Retry]
  D --> B
\`\`\`

Diagrams render in the preview panel.
`
			}
		}
	],
	workflow: {
		next: ['html-codec', 'word-counter']
	},
	metadata: {
		name: 'Markdown Preview',
		title: 'Markdown Preview — Live Markdown to HTML',
		description:
			'Preview Markdown as HTML while you type. Upload a .md file or paste text — supports headings, lists, links, code fences, Mermaid diagrams, and emphasis.',
		keywords: [
			'markdown preview',
			'markdown to html',
			'md preview',
			'live markdown',
			'readme preview',
			'mermaid markdown'
		],
		related: ['html-codec', 'word-counter', 'text-diff'],
		faq: [
			{
				question: 'Is this full CommonMark?',
				answer:
					'It covers a practical subset—headings, lists, code fences, links, bold/italic, and Mermaid diagrams—for quick previews, not every edge case of a full parser.'
			},
			{
				question: 'Does my Markdown leave the browser?',
				answer:
					'No. Rendering runs locally. Share link copies the tool URL only — your Markdown stays in the editor, not in the address bar.'
			},
			{
				question: 'Can I upload a Markdown file?',
				answer:
					'Yes. Drop or browse for a .md or .markdown file (up to 2 MB). The contents load into the editor and preview instantly.'
			},
			{
				question: 'Can I copy the HTML output?',
				answer:
					'Yes. Use copy/download on the generated HTML when you need a quick snippet. Escape further with HTML Encoder if you embed it in another document.'
			}
		],
		howTo: [
			'Upload a .md file or paste Markdown',
			'Watch the live HTML preview (Mermaid diagrams render automatically)',
			'Copy or download the HTML when ready'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte'), layout: 'split' },
	analytics: { eventName: 'tool_run' }
};
