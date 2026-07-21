import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, parsePageSelection, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

/** Map a page spec to 1-based page numbers for rendering. Empty spec returns all pages. */
export function getPageNumbersFromSpec(spec: string, pageCount: number): number[] {
	if (!spec.trim()) {
		return Array.from({ length: pageCount }, (_, i) => i + 1);
	}
	return parsePageSelection(spec, pageCount).map((i) => i + 1);
}

export const inputSchema = v.object({
	pdf: uint8ArraySchema,
	pagesSpec: v.optional(v.string())
});

export type PdfToImagesInput = v.InferOutput<typeof inputSchema>;
export type PdfToImagesOutput = { pageNumbers: number[] };

/** Pure helper — browser rendering happens in the UI via render.ts. */
export function resolvePageNumbers(input: PdfToImagesInput, pageCount: number): PdfToImagesOutput {
	return { pageNumbers: getPageNumbersFromSpec(input.pagesSpec ?? '', pageCount) };
}

export async function run(): Promise<PdfToImagesOutput> {
	throw new Error('PDF to Images rendering runs in the browser UI');
}

export const pdfToImages: ToolDefinition<PdfToImagesInput, PdfToImagesOutput> = {
	id: 'pdf-to-images',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'images', 'export', 'png', 'convert'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-merge', 'pdf-compress', 'images-to-pdf']
	},
	metadata: {
		name: 'PDF to Images',
		title: 'PDF to Images — Export PDF pages as PNG',
		description:
			'Render PDF pages to PNG images in your browser with pdf.js. Select a page range, preview thumbnails, and download.',
		keywords: ['pdf to images', 'pdf to png', 'export pdf pages', 'pdf screenshot'],
		related: ['images-to-pdf', 'pdf-merge', 'pdf-compress'],
		howTo: [
			'Upload a PDF (max 10 MB)',
			'Optionally limit pages (e.g. 1,3-5)',
			'Preview thumbnails and download the selected page from the action bar'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Pages are rendered locally with pdf.js in your browser.'
			},
			{
				question: 'What format are exports?',
				answer: 'PNG images rendered from each PDF page at 1.5× scale for readable quality.'
			},
			{
				question: 'Can I download all pages at once?',
				answer:
					'Use the action bar to download the currently selected page. Click a thumbnail to switch pages.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run' }
};
