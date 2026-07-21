import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, rotatePdf, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export const inputSchema = v.object({
	pdf: uint8ArraySchema,
	angle: v.picklist([90, 180, 270]),
	pagesSpec: v.union([v.literal('all'), v.string()])
});

export type PdfRotateInput = v.InferOutput<typeof inputSchema>;
export type PdfRotateOutput = Awaited<ReturnType<typeof rotatePdf>>;

export async function run(input: PdfRotateInput): Promise<PdfRotateOutput> {
	return rotatePdf(input.pdf, input.angle, input.pagesSpec);
}

export const pdfRotate: ToolDefinition<PdfRotateInput, PdfRotateOutput> = {
	id: 'pdf-rotate',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'rotate', 'orientation', 'pages'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-compress', 'pdf-reorder-pages', 'pdf-extract-pages']
	},
	metadata: {
		name: 'Rotate PDF',
		title: 'Rotate PDF — Turn pages 90°, 180°, or 270°',
		description:
			'Rotate all pages or a selected range in a PDF. Processing stays in your browser with pdf-lib.',
		keywords: ['rotate pdf', 'pdf rotate pages', 'turn pdf', 'rotate pdf online'],
		related: ['pdf-compress', 'pdf-reorder-pages', 'pdf-extract-pages'],
		howTo: [
			'Upload a PDF (max 10 MB)',
			'Pick rotation angle and page scope',
			'Download the rotated PDF'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Rotation runs locally in your browser.'
			},
			{
				question: 'Can I rotate only some pages?',
				answer: 'Yes. Choose selected pages and enter ranges like 1,3-5.'
			}
		]
	},
	validation: { input: inputSchema },
	run,
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['angle'] }
};
