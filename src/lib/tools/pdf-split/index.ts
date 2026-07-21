import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, splitPdf, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	pdf: uint8ArraySchema,
	mode: v.picklist(['all', 'ranges']),
	ranges: v.optional(v.string())
});

export type PdfSplitInput = v.InferOutput<typeof inputSchema>;
export type PdfSplitOutput = Awaited<ReturnType<typeof splitPdf>>;

export async function run(input: PdfSplitInput): Promise<PdfSplitOutput> {
	return splitPdf(input.pdf, input.mode, input.ranges);
}

export const pdfSplit: ToolDefinition<PdfSplitInput, PdfSplitOutput> = {
	id: 'pdf-split',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'split', 'pages', 'extract'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-extract-pages', 'pdf-merge', 'pdf-compress']
	},
	metadata: {
		name: 'Split PDF',
		title: 'Split PDF — Split pages into separate files',
		description:
			'Split a PDF into individual page files or custom page ranges in your browser. Download one combined range or each page separately.',
		keywords: ['split pdf', 'pdf split pages', 'extract pages', 'split pdf online'],
		related: ['pdf-extract-pages', 'pdf-merge', 'pdf-compress'],
		howTo: [
			'Upload a PDF (max 10 MB)',
			'Choose split every page or enter page ranges like 1,3-5',
			'Download the result from the action bar or per-page buttons'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Splitting runs locally with pdf-lib in your browser.'
			},
			{
				question: 'Can I download all pages at once as a ZIP?',
				answer:
					'Not yet. When splitting every page, use the per-page Download buttons. The action bar downloads the first page for convenience.'
			},
			{
				question: 'How do page ranges work?',
				answer: 'Use 1-based numbers like 1,3-5,8 to combine selected pages into one PDF.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
