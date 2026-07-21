import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, extractPdfPages, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	pdf: uint8ArraySchema,
	pagesSpec: v.pipe(v.string(), v.minLength(1, 'Enter pages to extract'))
});

export type PdfExtractPagesInput = v.InferOutput<typeof inputSchema>;
export type PdfExtractPagesOutput = Awaited<ReturnType<typeof extractPdfPages>>;

export async function run(input: PdfExtractPagesInput): Promise<PdfExtractPagesOutput> {
	return extractPdfPages(input.pdf, input.pagesSpec);
}

export const pdfExtractPages: ToolDefinition<PdfExtractPagesInput, PdfExtractPagesOutput> = {
	id: 'pdf-extract-pages',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'extract', 'pages', 'copy'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-merge', 'pdf-rotate', 'pdf-compress']
	},
	metadata: {
		name: 'Extract PDF Pages',
		title: 'Extract PDF Pages — Save selected pages as a new PDF',
		description:
			'Pull specific pages from a PDF into a new document. Enter ranges like 1,3-5 and download locally.',
		keywords: ['extract pdf pages', 'copy pdf pages', 'pdf page extractor'],
		related: ['pdf-merge', 'pdf-rotate', 'pdf-compress'],
		howTo: [
			'Upload a PDF (max 10 MB)',
			'Enter pages to keep in the new file',
			'Download the extracted PDF'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Extraction runs locally with pdf-lib.'
			},
			{
				question: 'How is this different from Split PDF?',
				answer:
					'Extract keeps your chosen pages in one PDF. Split can also export every page separately.'
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
