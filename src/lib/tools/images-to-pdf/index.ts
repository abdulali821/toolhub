import type { ToolDefinition } from '$engine/types';
import { imagesToPdf as buildImagesPdf, uint8ArraySchema } from '$lib/utils/pdf';
import * as v from 'valibot';

export const IMAGES_TO_PDF_CONSTRAINTS = {
	maxBytes: 10 * 1024 * 1024,
	accept: 'image/png,image/jpeg,image/jpg',
	mimeAllowlist: ['image/png', 'image/jpeg', 'image/jpg'],
	extensions: ['.png', '.jpg', '.jpeg']
};

export const inputSchema = v.object({
	images: v.pipe(
		v.array(
			v.object({
				bytes: uint8ArraySchema,
				mime: v.string()
			})
		),
		v.minLength(1, 'Add at least one image')
	)
});

export type ImagesToPdfInput = v.InferOutput<typeof inputSchema>;
export type ImagesToPdfOutput = Awaited<ReturnType<typeof buildImagesPdf>>;

export async function run(input: ImagesToPdfInput): Promise<ImagesToPdfOutput> {
	return buildImagesPdf(input.images);
}

export const imagesToPdf: ToolDefinition<ImagesToPdfInput, ImagesToPdfOutput> = {
	id: 'images-to-pdf',
	version: '1.0.0',
	category: 'pdf',
	mode: 'upload',
	status: 'stable',
	tags: ['pdf', 'images', 'convert', 'png', 'jpeg'],
	capabilities: ['upload', 'download', 'reset', 'favorite'],
	file: IMAGES_TO_PDF_CONSTRAINTS,
	workflow: {
		next: ['pdf-merge', 'pdf-compress', 'pdf-to-images']
	},
	metadata: {
		name: 'Images to PDF',
		title: 'Images to PDF — Combine PNG and JPEG into one PDF',
		description:
			'Turn multiple PNG or JPEG images into a single PDF with one page per image. Runs locally in your browser.',
		keywords: ['images to pdf', 'png to pdf', 'jpeg to pdf', 'combine images pdf'],
		related: ['pdf-merge', 'pdf-compress', 'pdf-to-images'],
		howTo: [
			'Add one or more PNG or JPEG images (max 10 MB each)',
			'Reorder if needed',
			'Download the combined PDF'
		],
		faq: [
			{
				question: 'Are images uploaded to a server?',
				answer: 'No. PDF creation runs locally with pdf-lib.'
			},
			{
				question: 'Which image formats are supported?',
				answer: 'PNG and JPEG only. Each image becomes one PDF page sized to the image dimensions.'
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
