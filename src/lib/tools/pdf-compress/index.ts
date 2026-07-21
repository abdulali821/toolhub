import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, compressPdf, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export type CompressMode = 'structure' | 'balanced' | 'strong';

export type RasterizeFn = (input: {
	bytes: Uint8Array;
	quality: number;
	scale: number;
}) => Promise<Uint8Array>;

export const inputSchema = v.object({
	pdf: uint8ArraySchema,
	mode: v.optional(v.picklist(['structure', 'balanced', 'strong'])),
	quality: v.optional(v.pipe(v.number(), v.minValue(0.4), v.maxValue(0.92)))
});

export type PdfCompressInput = {
	pdf: Uint8Array;
	mode?: CompressMode;
	quality?: number;
};
export type PdfCompressOutput = Awaited<ReturnType<typeof compressPdf>>;

export async function run(
	input: PdfCompressInput,
	rasterize?: RasterizeFn
): Promise<PdfCompressOutput> {
	return compressPdf(input.pdf, {
		mode: input.mode ?? 'balanced',
		quality: input.quality ?? 0.72,
		rasterize
	});
}

export const pdfCompress: ToolDefinition<PdfCompressInput, PdfCompressOutput> = {
	id: 'pdf-compress',
	version: '2.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'compress', 'optimize', 'reduce'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: PDF_FILE_CONSTRAINTS,
	workflow: {
		next: ['pdf-merge', 'pdf-rotate', 'pdf-split']
	},
	metadata: {
		name: 'Compress PDF',
		title: 'Compress PDF — Structure, balanced, or strong raster modes',
		description:
			'Reduce PDF size in your browser. Choose structure rewrite, balanced metadata stripping, or strong JPEG page rasterization for scan-heavy files.',
		keywords: [
			'compress pdf',
			'reduce pdf size',
			'optimize pdf',
			'pdf compressor online',
			'compress scanned pdf'
		],
		related: ['pdf-merge', 'pdf-rotate', 'pdf-split', 'pdf-to-images'],
		howTo: [
			'Upload a PDF (max 10 MB)',
			'Pick a compression mode (structure, balanced, or strong)',
			'Compare sizes and download the result'
		],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer:
					'No. Compression runs locally in your browser with pdf-lib and, for strong mode, pdf.js.'
			},
			{
				question: 'What is strong mode?',
				answer:
					'Strong mode redraws each page as a JPEG image and rebuilds the PDF. It often shrinks scans a lot, but text becomes an image (not selectable).'
			},
			{
				question: 'Why did structure mode barely shrink my file?',
				answer:
					'Already optimized or image-heavy PDFs need balanced/strong modes. Structure mode mainly rewrites object streams.'
			}
		]
	},
	validation: { input: inputSchema },
	run: (input) => run(input),
	ui: {
		component: () => import('./ui.svelte')
	},
	analytics: { eventName: 'tool_run', props: ['mode'] }
};
