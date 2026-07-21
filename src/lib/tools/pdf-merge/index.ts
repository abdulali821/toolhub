import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, uint8ArraySchema } from '$lib/utils/pdf';
import { PDFDocument } from 'pdf-lib';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	pdfs: v.pipe(v.array(uint8ArraySchema), v.minLength(1, 'Add at least one PDF'))
});

export type PdfMergeInput = v.InferOutput<typeof inputSchema>;
export type PdfMergeOutput = { pdfBytes: Uint8Array; pageCount: number };

export async function mergePdfBytes(buffers: Uint8Array[]): Promise<PdfMergeOutput> {
	const merged = await PDFDocument.create();
	let pageCount = 0;

	for (const buffer of buffers) {
		const doc = await PDFDocument.load(buffer);
		const pages = await merged.copyPages(doc, doc.getPageIndices());
		for (const page of pages) {
			merged.addPage(page);
			pageCount += 1;
		}
	}

	const pdfBytes = await merged.save();
	return { pdfBytes, pageCount };
}

export async function run(input: PdfMergeInput): Promise<PdfMergeOutput> {
	return mergePdfBytes(input.pdfs);
}

export const pdfMerge: ToolDefinition<PdfMergeInput, PdfMergeOutput> = {
	id: 'pdf-merge',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'merge', 'combine', 'join'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-rotate', 'pdf-compress', 'pdf-extract-pages']
	},
	metadata: {
		name: 'PDF Merge',
		title: 'PDF Merge — Combine PDF files into one',
		description:
			'Merge multiple PDF documents into a single file in your browser using pdf-lib. Reorder by upload sequence and download the result.',
		keywords: ['pdf merge', 'combine pdf', 'join pdf files', 'merge pdf online'],
		related: ['pdf-rotate', 'pdf-compress', 'pdf-extract-pages'],
		howTo: [
			'Add two or more PDFs (max 10 MB each)',
			'Reorder files with the Up button if needed',
			'Download the merged PDF from the action bar'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Files are read and merged locally with pdf-lib in your browser.'
			},
			{
				question: 'How many files can I merge?',
				answer: 'Add PDFs one at a time or via multi-select. Each file can be up to 10 MB.'
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
