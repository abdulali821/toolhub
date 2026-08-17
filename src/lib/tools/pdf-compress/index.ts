import type { ToolDefinition } from '$engine/types';
import { PDF_FILE_CONSTRAINTS, compressPdf, uint8ArraySchema } from '$lib/utils/pdf';
import { recompressEmbeddedImages } from '$lib/utils/pdf-image-compress';
import * as v from 'valibot';

export { PDF_FILE_CONSTRAINTS };

export type CompressMode = 'recommended' | 'high' | 'extreme';

export type RasterizeFn = (input: {
	bytes: Uint8Array;
	quality: number;
	scale: number;
}) => Promise<Uint8Array>;

export const inputSchema = v.object({
	pdf: uint8ArraySchema,
	mode: v.optional(v.picklist(['recommended', 'high', 'extreme'])),
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
	hooks?: {
		rasterize?: RasterizeFn;
		recompressImages?: typeof recompressEmbeddedImages;
	}
): Promise<PdfCompressOutput> {
	return compressPdf(input.pdf, {
		mode: input.mode ?? 'recommended',
		quality: input.quality ?? 0.72,
		rasterize: hooks?.rasterize,
		recompressImages: hooks?.recompressImages
	});
}

export const pdfCompress: ToolDefinition<PdfCompressInput, PdfCompressOutput> = {
	id: 'pdf-compress',
	version: '2.2.0',
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
		title: 'Compress PDF — Reduce file size online',
		description:
			'Make PDF files smaller in your browser. Choose Recommended, Less compression, or Extreme.',
		keywords: ['compress pdf', 'reduce pdf size', 'optimize pdf', 'pdf compressor online'],
		related: ['pdf-merge', 'pdf-rotate', 'pdf-split', 'pdf-to-images'],
		howTo: ['Upload a PDF (max 10 MB)', 'Pick a compression level', 'Download the compressed file'],
		faq: [
			{
				question: 'Are PDFs uploaded to a server?',
				answer: 'No. Everything runs in your browser.'
			},
			{
				question: 'Why is my file the same size?',
				answer: 'It may already be optimized. Try Extreme mode for scans and photo-heavy PDFs.'
			},
			{
				question: 'What is Extreme mode?',
				answer: 'Strongest compression. Best for scans and photos.'
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
