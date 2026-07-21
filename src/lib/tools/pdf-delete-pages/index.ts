import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, deletePdfPages, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	pdf: uint8ArraySchema,
	pagesSpec: v.pipe(v.string(), v.minLength(1, 'Enter pages to delete'))
});

export type PdfDeletePagesInput = v.InferOutput<typeof inputSchema>;
export type PdfDeletePagesOutput = Awaited<ReturnType<typeof deletePdfPages>>;

export async function run(input: PdfDeletePagesInput): Promise<PdfDeletePagesOutput> {
	return deletePdfPages(input.pdf, input.pagesSpec);
}

export const pdfDeletePages: ToolDefinition<PdfDeletePagesInput, PdfDeletePagesOutput> = {
	id: 'pdf-delete-pages',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'delete', 'pages', 'remove'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-extract-pages', 'pdf-split', 'pdf-merge']
	},
	metadata: {
		name: 'Delete PDF Pages',
		title: 'Delete PDF Pages — Remove unwanted pages',
		description:
			'Remove selected pages from a PDF while keeping the rest. Runs locally in your browser.',
		keywords: ['delete pdf pages', 'remove pdf pages', 'pdf page remover'],
		related: ['pdf-extract-pages', 'pdf-split', 'pdf-merge'],
		howTo: [
			'Upload a PDF (max 10 MB)',
			'Enter page numbers to remove (e.g. 2,4-6)',
			'Download the trimmed PDF'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Page deletion runs locally with pdf-lib.'
			},
			{
				question: 'Can I delete every page?',
				answer: 'No. At least one page must remain in the output PDF.'
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
