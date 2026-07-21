import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, reorderPdfPages, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	pdf: uint8ArraySchema,
	orderSpec: v.pipe(v.string(), v.minLength(1, 'Enter the new page order'))
});

export type PdfReorderPagesInput = v.InferOutput<typeof inputSchema>;
export type PdfReorderPagesOutput = Awaited<ReturnType<typeof reorderPdfPages>>;

export async function run(input: PdfReorderPagesInput): Promise<PdfReorderPagesOutput> {
	return reorderPdfPages(input.pdf, input.orderSpec);
}

export const pdfReorderPages: ToolDefinition<PdfReorderPagesInput, PdfReorderPagesOutput> = {
	id: 'pdf-reorder-pages',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'reorder', 'pages', 'sort'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-rotate', 'pdf-extract-pages', 'pdf-merge']
	},
	metadata: {
		name: 'Reorder PDF Pages',
		title: 'Reorder PDF Pages — Rearrange page order',
		description:
			'Rearrange PDF pages by listing every page number once in the desired order. Processing stays in your browser.',
		keywords: ['reorder pdf pages', 'rearrange pdf', 'sort pdf pages'],
		related: ['pdf-rotate', 'pdf-extract-pages', 'pdf-merge'],
		howTo: [
			'Upload a PDF (max 10 MB)',
			'Note the page count shown after load',
			'Enter the full new order (e.g. 3,1,2 for a 3-page PDF) and download'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Reordering runs locally with pdf-lib.'
			},
			{
				question: 'Must I list every page?',
				answer: 'Yes. The order must include each page exactly once with no duplicates.'
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
