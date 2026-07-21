import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, readPdfMetadata, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	pdf: uint8ArraySchema
});

export type PdfMetadataInput = v.InferOutput<typeof inputSchema>;
export type PdfMetadataOutput = Awaited<ReturnType<typeof readPdfMetadata>>;

export async function run(input: PdfMetadataInput): Promise<PdfMetadataOutput> {
	return readPdfMetadata(input.pdf);
}

export const pdfMetadata: ToolDefinition<PdfMetadataInput, PdfMetadataOutput> = {
	id: 'pdf-metadata',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'metadata', 'info', 'properties'],
	capabilities: ['upload', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-compress', 'pdf-merge', 'pdf-extract-pages']
	},
	metadata: {
		name: 'PDF Metadata Viewer',
		title: 'PDF Metadata Viewer — Inspect title, author, and properties',
		description:
			'View PDF document properties including title, author, page count, and dates. All processing stays in your browser.',
		keywords: ['pdf metadata', 'pdf properties', 'pdf info viewer'],
		related: ['pdf-compress', 'pdf-merge', 'pdf-extract-pages'],
		howTo: [
			'Upload a PDF (max 10 MB)',
			'Review document properties instantly',
			'Continue to compress, merge, or extract pages if needed'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Metadata is read locally with pdf-lib.'
			},
			{
				question: 'Can I edit metadata here?',
				answer: 'This tool is read-only. Use a dedicated PDF editor to change document properties.'
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
