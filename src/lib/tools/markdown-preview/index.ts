import type { ToolDefinition } from '$engine/types';
import * as v from 'valibot';

export const inputSchema = v.object({
	markdown: v.string()
});

export type MarkdownPreviewInput = v.InferOutput<typeof inputSchema>;
export type MarkdownPreviewOutput = { html: string };

function escapeHtml(text: string) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Lightweight Markdown subset — no dependency, good enough for previews. */
export function run(input: MarkdownPreviewInput): MarkdownPreviewOutput {
	const lines = input.markdown.replace(/\r\n/g, '\n').split('\n');
	const html: string[] = [];
	let inCode = false;
	let inList = false;

	const closeList = () => {
		if (inList) {
			html.push('</ul>');
			inList = false;
		}
	};

	for (const raw of lines) {
		if (raw.startsWith('```')) {
			closeList();
			if (inCode) {
				html.push('</code></pre>');
				inCode = false;
			} else {
				html.push('<pre><code>');
				inCode = true;
			}
			continue;
		}

		if (inCode) {
			html.push(`${escapeHtml(raw)}\n`);
			continue;
		}

		if (/^\s*[-*]\s+/.test(raw)) {
			if (!inList) {
				html.push('<ul>');
				inList = true;
			}
			const item = raw.replace(/^\s*[-*]\s+/, '');
			html.push(`<li>${inline(item)}</li>`);
			continue;
		}

		closeList();

		if (/^###\s+/.test(raw)) html.push(`<h3>${inline(raw.slice(4))}</h3>`);
		else if (/^##\s+/.test(raw)) html.push(`<h2>${inline(raw.slice(3))}</h2>`);
		else if (/^#\s+/.test(raw)) html.push(`<h1>${inline(raw.slice(2))}</h1>`);
		else if (/^>\s+/.test(raw)) html.push(`<blockquote>${inline(raw.slice(2))}</blockquote>`);
		else if (raw.trim() === '') html.push('');
		else html.push(`<p>${inline(raw)}</p>`);
	}

	closeList();
	if (inCode) html.push('</code></pre>');

	return { html: html.filter(Boolean).join('\n') };
}

function inline(text: string) {
	return escapeHtml(text)
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
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
		}
	],
	workflow: {
		next: ['html-codec', 'word-counter']
	},
	metadata: {
		name: 'Markdown Preview',
		title: 'Markdown Preview — Live Markdown to HTML',
		description:
			'Preview Markdown as HTML while you type. Supports headings, lists, links, code fences, and emphasis—ideal for README drafts and docs, with no upload required.',
		keywords: [
			'markdown preview',
			'markdown to html',
			'md preview',
			'live markdown',
			'readme preview'
		],
		related: ['html-codec', 'word-counter', 'text-diff'],
		faq: [
			{
				question: 'Is this full CommonMark?',
				answer:
					'It covers a practical subset—headings, lists, code fences, links, bold/italic—for quick previews, not every edge case of a full parser.'
			},
			{
				question: 'Does my Markdown leave the browser?',
				answer:
					'No. Rendering runs locally. Share link copies the tool URL only — your Markdown stays in the editor, not in the address bar.'
			},
			{
				question: 'Can I copy the HTML output?',
				answer:
					'Yes. Use copy/download on the generated HTML when you need a quick snippet. Escape further with HTML Encoder if you embed it in another document.'
			}
		],
		howTo: [
			'Paste or write Markdown',
			'Watch the live HTML preview',
			'Copy or download the HTML when ready'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: { component: () => import('./ui.svelte'), layout: 'split' },
	analytics: { eventName: 'tool_run' }
};
