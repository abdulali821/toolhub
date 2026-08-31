import type { ToolDefinition } from '$engine/types';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as v from 'valibot';
import { pdfBytesToDataUrl } from '$lib/utils/pdf';
import { MARKDOWN_FILE_CONSTRAINTS } from '$lib/utils/markdown';
import type { MermaidRaster } from '$lib/utils/mermaid-render';

export const inputSchema = v.object({
	markdown: v.pipe(v.string(), v.minLength(1, 'Enter some Markdown'))
});

export type MarkdownToPdfInput = v.InferOutput<typeof inputSchema>;
export type MarkdownToPdfOutput = {
	dataUrl: string;
	pageCount: number;
	bytes: Uint8Array;
};

export type MdBlock =
	| { type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'quote' | 'code' | 'mermaid'; text: string }
	| { type: 'blank' };

/** Strip common Markdown inline markers for plain PDF text. */
export function stripInlineMarkdown(text: string): string {
	return text
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
		.replace(/\\([\\`*_[\]()#+\-.!>])/g, '$1');
}

/** Parse a practical Markdown subset into layout blocks (shared with tests). */
export function parseMarkdownBlocks(markdown: string): MdBlock[] {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const blocks: MdBlock[] = [];
	let inCode = false;
	let codeLang = '';
	let codeLines: string[] = [];

	const flushCode = () => {
		if (!codeLines.length) return;
		const text = codeLines.join('\n');
		blocks.push({ type: codeLang === 'mermaid' ? 'mermaid' : 'code', text });
		codeLines = [];
		codeLang = '';
	};

	for (const raw of lines) {
		if (raw.startsWith('```')) {
			if (inCode) {
				flushCode();
				inCode = false;
			} else {
				codeLang = raw.slice(3).trim().toLowerCase();
				codeLines = [];
				inCode = true;
			}
			continue;
		}

		if (inCode) {
			codeLines.push(raw);
			continue;
		}

		if (raw.trim() === '') {
			blocks.push({ type: 'blank' });
			continue;
		}

		if (/^###\s+/.test(raw)) {
			blocks.push({ type: 'h3', text: stripInlineMarkdown(raw.replace(/^###\s+/, '')) });
		} else if (/^##\s+/.test(raw)) {
			blocks.push({ type: 'h2', text: stripInlineMarkdown(raw.replace(/^##\s+/, '')) });
		} else if (/^#\s+/.test(raw)) {
			blocks.push({ type: 'h1', text: stripInlineMarkdown(raw.replace(/^#\s+/, '')) });
		} else if (/^\s*[-*]\s+/.test(raw)) {
			blocks.push({
				type: 'li',
				text: stripInlineMarkdown(raw.replace(/^\s*[-*]\s+/, ''))
			});
		} else if (/^>\s?/.test(raw)) {
			blocks.push({ type: 'quote', text: stripInlineMarkdown(raw.replace(/^>\s?/, '')) });
		} else {
			blocks.push({ type: 'p', text: stripInlineMarkdown(raw) });
		}
	}

	if (inCode) flushCode();
	return blocks;
}

function wrapLine(
	text: string,
	font: { widthOfTextAtSize: (t: string, size: number) => number },
	size: number,
	maxWidth: number
): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	if (!words.length) return [''];
	const lines: string[] = [];
	let current = words[0]!;

	for (let i = 1; i < words.length; i++) {
		const word = words[i]!;
		const candidate = `${current} ${word}`;
		if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
			current = candidate;
		} else {
			lines.push(current);
			current = word;
		}
	}
	lines.push(current);
	return lines;
}

const PAGE = { width: 612, height: 792 }; // US Letter
const MARGIN = 54;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const MAX_IMAGE_HEIGHT = PAGE.height - MARGIN * 2;

async function rasterizeMermaidBlocks(blocks: MdBlock[]): Promise<Map<number, MermaidRaster>> {
	const images = new Map<number, MermaidRaster>();
	if (typeof document === 'undefined') return images;

	const indices: number[] = [];
	const sources: string[] = [];

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		if (block?.type !== 'mermaid') continue;
		indices.push(i);
		sources.push(block.text);
	}

	if (!sources.length) return images;

	const { renderMermaidBatchToPng } = await import('$lib/utils/mermaid-render');
	const rasters = await renderMermaidBatchToPng(sources);

	indices.forEach((blockIndex, rasterIndex) => {
		const raster = rasters[rasterIndex];
		if (raster) images.set(blockIndex, raster);
	});

	return images;
}

function fitImageSize(naturalWidth: number, naturalHeight: number) {
	const widthScale = CONTENT_WIDTH / naturalWidth;
	let drawWidth = CONTENT_WIDTH;
	let drawHeight = naturalHeight * widthScale;

	if (drawHeight > MAX_IMAGE_HEIGHT) {
		const heightScale = MAX_IMAGE_HEIGHT / naturalHeight;
		drawHeight = MAX_IMAGE_HEIGHT;
		drawWidth = naturalWidth * heightScale;
	}

	return { drawWidth, drawHeight };
}

export async function run(input: MarkdownToPdfInput): Promise<MarkdownToPdfOutput> {
	const blocks = parseMarkdownBlocks(input.markdown);
	const mermaidImages = await rasterizeMermaidBlocks(blocks);
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
	const fontMono = await doc.embedFont(StandardFonts.Courier);

	let page = doc.addPage([PAGE.width, PAGE.height]);
	let y = PAGE.height - MARGIN;

	const ensureSpace = (needed: number) => {
		if (y - needed < MARGIN) {
			page = doc.addPage([PAGE.width, PAGE.height]);
			y = PAGE.height - MARGIN;
		}
	};

	const drawWrapped = (
		text: string,
		opts: {
			size: number;
			font: typeof font;
			color?: ReturnType<typeof rgb>;
			lineHeight: number;
			indent?: number;
			gapAfter?: number;
		}
	) => {
		const indent = opts.indent ?? 0;
		const maxWidth = CONTENT_WIDTH - indent;
		const lines = wrapLine(text, opts.font, opts.size, maxWidth);
		for (const line of lines) {
			ensureSpace(opts.lineHeight);
			page.drawText(line, {
				x: MARGIN + indent,
				y: y - opts.size,
				size: opts.size,
				font: opts.font,
				color: opts.color ?? rgb(0.1, 0.1, 0.12),
				maxWidth
			});
			y -= opts.lineHeight;
		}
		if (opts.gapAfter) y -= opts.gapAfter;
	};

	const drawCodeBlock = (text: string) => {
		const codeLines = text.split('\n');
		const size = 9;
		const lineHeight = 12;
		const blockHeight = codeLines.length * lineHeight + 16;
		ensureSpace(blockHeight);
		page.drawRectangle({
			x: MARGIN,
			y: y - blockHeight,
			width: CONTENT_WIDTH,
			height: blockHeight,
			color: rgb(0.96, 0.96, 0.97)
		});
		y -= 8;
		for (const line of codeLines) {
			const safe = [...line]
				.map((ch) => {
					const code = ch.charCodeAt(0);
					if (code === 9 || code === 10 || code === 13) return ch;
					if (code >= 32 && code <= 126) return ch;
					return '?';
				})
				.join('');
			ensureSpace(lineHeight);
			page.drawText(safe || ' ', {
				x: MARGIN + 10,
				y: y - size,
				size,
				font: fontMono,
				color: rgb(0.15, 0.15, 0.18),
				maxWidth: CONTENT_WIDTH - 20
			});
			y -= lineHeight;
		}
		y -= 12;
	};

	for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
		const block = blocks[blockIndex]!;
		switch (block.type) {
			case 'blank':
				y -= 10;
				break;
			case 'h1':
				y -= 8;
				drawWrapped(block.text, {
					size: 22,
					font: fontBold,
					lineHeight: 28,
					gapAfter: 10
				});
				break;
			case 'h2':
				y -= 6;
				drawWrapped(block.text, {
					size: 16,
					font: fontBold,
					lineHeight: 22,
					gapAfter: 8
				});
				break;
			case 'h3':
				y -= 4;
				drawWrapped(block.text, {
					size: 13,
					font: fontBold,
					lineHeight: 18,
					gapAfter: 6
				});
				break;
			case 'li':
				drawWrapped(`• ${block.text}`, {
					size: 11,
					font,
					lineHeight: 16,
					indent: 12,
					gapAfter: 4
				});
				break;
			case 'quote':
				drawWrapped(block.text, {
					size: 11,
					font,
					color: rgb(0.35, 0.35, 0.4),
					lineHeight: 16,
					indent: 16,
					gapAfter: 6
				});
				break;
			case 'mermaid': {
				const raster = mermaidImages.get(blockIndex);
				if (raster) {
					const pngImage = await doc.embedPng(raster.png);
					const { drawWidth, drawHeight } = fitImageSize(raster.width, raster.height);
					ensureSpace(drawHeight + 16);
					page.drawImage(pngImage, {
						x: MARGIN + (CONTENT_WIDTH - drawWidth) / 2,
						y: y - drawHeight,
						width: drawWidth,
						height: drawHeight
					});
					y -= drawHeight + 16;
					break;
				}
				drawCodeBlock(block.text);
				break;
			}
			case 'code':
				drawCodeBlock(block.text);
				break;
			case 'p':
			default:
				drawWrapped(block.text, {
					size: 11,
					font,
					lineHeight: 16,
					gapAfter: 8
				});
				break;
		}
	}

	const bytes = await doc.save();
	return {
		bytes,
		pageCount: doc.getPageCount(),
		dataUrl: pdfBytesToDataUrl(bytes)
	};
}

const DEFAULT_MARKDOWN = `# HeyTools

Convert **Markdown** notes into a downloadable PDF.

## Features

- Headings and paragraphs
- Bullet lists
- Code fences

> Private by default — rendered locally with pdf-lib.

\`\`\`
npm start
\`\`\`
`;

export const markdownToPdf: ToolDefinition<MarkdownToPdfInput, MarkdownToPdfOutput> = {
	id: 'markdown-to-pdf',
	version: '1.0.0',
	category: 'pdf',
	mode: 'instant',
	status: 'stable',
	tags: ['markdown', 'pdf', 'convert', 'document', 'md'],
	capabilities: ['download', 'share', 'reset', 'favorite'],
	file: MARKDOWN_FILE_CONSTRAINTS,
	// Markdown is not synced into the URL (too large). Presets still set
	// `?markdown=` once; the UI applies it and immediately strips the param.
	share: {
		params: ['markdown']
	},
	presets: [
		{ id: 'intro', label: 'Intro sample', params: { markdown: DEFAULT_MARKDOWN } },
		{
			id: 'notes',
			label: 'Meeting notes',
			params: {
				markdown: `# Meeting notes

## Agenda

- Review milestones
- Assign owners
- Next steps

## Action items

- Ship Markdown to PDF
- Collect feedback
`
			}
		}
	],
	workflow: {
		next: ['markdown-to-html', 'markdown-preview', 'pdf-compress']
	},
	metadata: {
		name: 'Markdown to PDF',
		title: 'Markdown to PDF — Convert MD notes to a PDF online',
		description:
			'Convert Markdown to a downloadable PDF in your browser. Upload a .md file or paste text — supports headings, lists, quotes, code blocks, and Mermaid diagrams.',
		keywords: [
			'markdown to pdf',
			'md to pdf',
			'convert markdown pdf',
			'markdown pdf converter',
			'notes to pdf'
		],
		related: ['markdown-to-html', 'markdown-preview', 'images-to-pdf', 'pdf-compress'],
		faq: [
			{
				question: 'Is my Markdown uploaded?',
				answer: 'No. The PDF is built locally in your browser with pdf-lib.'
			},
			{
				question: 'Which Markdown features are supported?',
				answer:
					'Headings (#–###), paragraphs, bullet lists, blockquotes, fenced code blocks, and Mermaid flowcharts (rendered as images). Inline bold/italic/links are flattened to plain text in the PDF.'
			},
			{
				question: 'Can I preview before downloading?',
				answer:
					'Yes. After Generate / Preview, hover a page thumbnail and click the eye icon to open it fullscreen. Use Previous/Next in the modal when there are multiple pages.'
			},
			{
				question: 'Can I use fancy fonts or images?',
				answer:
					'v1 uses standard PDF fonts (Helvetica/Courier) for reliability. Images and custom fonts are not embedded yet.'
			}
		],
		howTo: [
			'Paste or write your Markdown',
			'Click Generate / Preview to build the PDF',
			'Preview a page with the eye icon, then Download from the Action Bar'
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
